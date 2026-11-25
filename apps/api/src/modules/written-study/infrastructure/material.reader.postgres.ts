import type { UserId } from '@inzpro/domain/modules/identity/user'
import { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import {
  PathDocumentPosition,
  QuestionCount,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import {
  QuestionRevisionId,
  WrittenQuestionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import { uncoveredQuestions } from '@inzpro/domain/modules/learning/study-session'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Array as Arr, Effect, Option, Schema } from 'effect'
import { SqlClient, type Statement } from 'effect/sql'
import { makeCursorPaginator, mapCursorPage } from '~api/lib/cursor-pagination.js'
import {
  type LearningRoundNumber,
  LearningRoundProgress,
} from '~api/modules/learning/domain/learning-round.model.js'
import { StudyReadError } from '~api/modules/written-study/application/errors.js'
import {
  DocumentQuestionPool,
  SessionDocument,
} from '~api/modules/written-study/domain/study-document.model.js'
import { type SessionCandidate } from '~api/modules/written-study/domain/study-session.model.js'

const CandidateRow = Schema.Struct({
  questionId: WrittenQuestionId,
  questionRevisionId: QuestionRevisionId,
  answerId: QuestionAnswerId,
})

const toCandidates = (
  rows: ReadonlyArray<typeof CandidateRow.Type>,
): ReadonlyArray<SessionCandidate> => {
  const candidates = new Map<string, SessionCandidate & { answerIds: Array<QuestionAnswerId> }>()

  for (const row of rows) {
    const candidate = candidates.get(row.questionRevisionId) ?? {
      questionId: row.questionId,
      questionRevisionId: row.questionRevisionId,
      answerIds: [],
    }

    candidate.answerIds.push(row.answerId)
    candidates.set(row.questionRevisionId, candidate)
  }

  return [...candidates.values()]
}

const DocumentPoolRow = Schema.Struct({
  id: ReferenceDocumentId,
  title: Schema.NonEmptyString,
  availableQuestionCount: QuestionCount,
  completedQuestionCount: QuestionCount,
  position: PathDocumentPosition,
})

const toDocumentPool = ({
  position: _position,
  ...pool
}: typeof DocumentPoolRow.Type): DocumentQuestionPool => pool

export const writtenMaterialReader = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  const columns = sql`d.id,d.title,count(r.id)::integer AS available_question_count,count(cr.id)::integer AS completed_question_count`

  const roundCoverage = (userId: UserId, round: LearningRoundNumber | Statement.Fragment) =>
    sql`LEFT JOIN written_question_coverage c ON c.user_id=${userId} AND c.qualification_path_id=pq.qualification_path_id AND c.question_id=q.id AND c.round_number=${round}
 LEFT JOIN question_revisions cr ON cr.id=c.question_revision_id AND cr.substantive_revision_id=r.substantive_revision_id`

  const documentPools = (userId: UserId, pathId: QualificationPathId, round: LearningRoundNumber) =>
    sql`FROM path_documents pd JOIN reference_documents d ON d.id=pd.document_id
 LEFT JOIN path_questions pq ON pq.qualification_path_id=pd.qualification_path_id AND pq.document_id=d.id
 LEFT JOIN written_questions q ON q.id=pq.question_id
 LEFT JOIN question_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 ${roundCoverage(userId, round)}
 WHERE pd.qualification_path_id=${pathId}`

  const documentsPage = makeCursorPaginator(
    sql,
    Schema.Struct({ position: PathDocumentPosition }),
    [['position', sql`pd.position`, 'asc']],
  )

  return {
    learningRound: Effect.fn('StudyReader.learningRound')(
      function* (userId, pathId) {
        const rows =
          yield* sql`WITH lr AS (SELECT coalesce((SELECT round_number FROM written_learning_rounds WHERE user_id=${userId} AND qualification_path_id=${pathId} LIMIT 1),1) AS round)
 SELECT lr.round,count(r.id)::integer AS question_count,count(cr.id)::integer AS covered_question_count
 FROM lr LEFT JOIN path_questions pq ON pq.qualification_path_id=${pathId}
 LEFT JOIN written_questions q ON q.id=pq.question_id
 LEFT JOIN question_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 ${roundCoverage(userId, sql`lr.round`)}
 GROUP BY lr.round`

        const [progress] = yield* Schema.decodeUnknownEffect(Schema.Tuple([LearningRoundProgress]))(
          rows,
        )

        return progress
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
    documents: Effect.fn('StudyReader.documents')(
      function* (userId, pathId, round, req) {
        return yield* documentsPage(
          req,
          page =>
            sql`SELECT ${columns},pd.position ${documentPools(userId, pathId, round)} AND ${page.after} GROUP BY d.id,d.title,pd.position HAVING count(pq.question_id)>0 ORDER BY ${page.orderBy} LIMIT ${page.limit}`.pipe(
              Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(DocumentPoolRow))),
            ),
          row => ({ position: row.position }),
        ).pipe(Effect.map(page => mapCursorPage(page, toDocumentPool)))
      },
      Effect.catchTags({
        SqlError: cause => Effect.fail(new StudyReadError({ cause })),
        SchemaError: cause => Effect.fail(new StudyReadError({ cause })),
      }),
    ),
    nextDocument: Effect.fn('StudyReader.nextDocument')(
      function* (userId, pathId, { round, fromDocumentId, skipsStartDocument }) {
        const isCovered = sql`count(r.id)<=count(cr.id)`

        const order = sql.csv([
          isCovered,
          ...Option.match(fromDocumentId, {
            onNone: () => [],
            onSome: id => {
              const start = sql`(SELECT position FROM path_documents WHERE qualification_path_id=${pathId} AND document_id=${id})`

              return [
                skipsStartDocument
                  ? sql`pd.position<=${start}`
                  : sql`CASE WHEN ${isCovered} THEN pd.position<=${start} ELSE pd.position<${start} END`,
              ]
            },
          }),
          sql`pd.position`,
        ])

        const rows =
          yield* sql`SELECT ${columns} ${documentPools(userId, pathId, round)} GROUP BY d.id,d.title,pd.position HAVING count(r.id)>0 ORDER BY ${order} LIMIT 1`

        const data = yield* Schema.decodeUnknownEffect(Schema.Array(DocumentQuestionPool))(rows)

        return Option.fromNullishOr(data[0])
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
    document: Effect.fn('StudyReader.document')(
      function* (userId, pathId, round, documentId) {
        const rows =
          yield* sql`SELECT ${columns} ${documentPools(userId, pathId, round)} AND d.id=${documentId} GROUP BY d.id,d.title LIMIT 1`

        const data = yield* Schema.decodeUnknownEffect(Schema.Array(DocumentQuestionPool))(rows)

        return Option.fromNullishOr(data[0])
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
    pathDocument: Effect.fn('StudyReader.pathDocument')(
      function* (pathId, documentId) {
        const rows =
          yield* sql`SELECT d.id,d.title FROM path_documents pd JOIN reference_documents d ON d.id=pd.document_id
 WHERE pd.qualification_path_id=${pathId} AND pd.document_id=${documentId} LIMIT 1`

        return Arr.head(yield* Schema.decodeUnknownEffect(Schema.Array(SessionDocument))(rows))
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
    isPathQuestion: Effect.fn('StudyReader.isPathQuestion')(
      function* (pathId, questionId) {
        const rows =
          yield* sql`SELECT EXISTS (SELECT 1 FROM path_questions WHERE qualification_path_id=${pathId} AND question_id=${questionId}) AS is_on_path`

        const [{ isOnPath }] = yield* Schema.decodeUnknownEffect(
          Schema.Tuple([Schema.Struct({ isOnPath: Schema.Boolean })]),
        )(rows)

        return isOnPath
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
    sessionCandidates: Effect.fn('StudyReader.sessionCandidates')(
      function* (userId, pathId, round, documentId, selection, limit) {
        const uncovered =
          selection === uncoveredQuestions
            ? sql`NOT EXISTS (SELECT 1 FROM written_question_coverage c JOIN question_revisions cr ON cr.id=c.question_revision_id
 WHERE c.user_id=${userId} AND c.qualification_path_id=pq.qualification_path_id AND c.question_id=q.id AND c.round_number=${round} AND cr.substantive_revision_id=r.substantive_revision_id)`
            : sql`true`

        const rows = yield* sql`SELECT c.question_id,c.question_revision_id,a.id AS answer_id FROM (
 SELECT q.id AS question_id,r.id AS question_revision_id,q.created_at FROM path_questions pq
 JOIN written_questions q ON q.id=pq.question_id
 JOIN question_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 WHERE pq.qualification_path_id=${pathId} AND pq.document_id=${documentId} AND ${uncovered} ORDER BY q.created_at,q.id LIMIT ${limit}
 ) c JOIN question_answers a ON a.question_revision_id=c.question_revision_id
 ORDER BY c.created_at,c.question_id,a.created_at,a.id`

        return toCandidates(yield* Schema.decodeUnknownEffect(Schema.Array(CandidateRow))(rows))
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
  }
})
