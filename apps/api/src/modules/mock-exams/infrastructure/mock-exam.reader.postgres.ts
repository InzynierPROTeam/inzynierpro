import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import {
  QuestionCount,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import {
  QuestionRevisionId,
  WrittenQuestionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import {
  ExamBlueprintId,
  ExamBlueprintVersion,
  ExamDurationMinutes,
  ExamSectionName,
  ExamSectionPosition,
} from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import {
  AttemptQuestionPosition,
  MockExamAttemptId,
  MockExamAttemptStatus,
  unfinishedAttemptStatuses,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Array as Arr, Effect, Layer, Option, Schema } from 'effect'
import { SqlClient, type Statement } from 'effect/sql'
import { MockExamReadError } from '~api/modules/mock-exams/application/errors.js'
import { MockExamReader } from '~api/modules/mock-exams/application/mock-exam.reader.js'
import type { ExamBlueprint } from '~api/modules/mock-exams/domain/exam-blueprint.model.js'
import type {
  AttemptQuestion,
  MockExamAttemptSummary,
} from '~api/modules/mock-exams/domain/mock-exam-attempt.model.js'

const BlueprintVersionRow = Schema.Struct({
  id: ExamBlueprintId,
  version: ExamBlueprintVersion,
  durationMinutes: ExamDurationMinutes,
  passThreshold: QuestionCount,
})

const SectionDocumentRow = Schema.Struct({
  position: ExamSectionPosition,
  name: ExamSectionName,
  questionCount: QuestionCount,
  documentId: Schema.NullOr(ReferenceDocumentId),
  documentTitle: Schema.NullOr(Schema.NonEmptyString),
})

const SectionEligibilityRow = Schema.Struct({
  position: ExamSectionPosition,
  availableQuestionCount: QuestionCount,
})

const CandidateRow = Schema.Struct({
  section: ExamSectionPosition,
  questionId: WrittenQuestionId,
  questionRevisionId: QuestionRevisionId,
})

const CandidateAnswerRow = Schema.Struct({
  questionRevisionId: QuestionRevisionId,
  answerId: QuestionAnswerId,
})

const AttemptSummaryRow = Schema.Struct({
  id: MockExamAttemptId,
  status: MockExamAttemptStatus,
  startedAt: DateTimeUtc,
})

const AttemptRow = Schema.Struct({
  ...AttemptSummaryRow.fields,
  blueprintId: ExamBlueprintId,
  blueprintVersion: ExamBlueprintVersion,
  durationMinutes: ExamDurationMinutes,
  passThreshold: QuestionCount,
  questionCount: QuestionCount,
})

const AttemptSectionRow = Schema.Struct({
  position: ExamSectionPosition,
  name: ExamSectionName,
  questionCount: QuestionCount,
})

const AttemptQuestionRow = Schema.Struct({
  position: AttemptQuestionPosition,
  section: ExamSectionPosition,
  questionId: WrittenQuestionId,
  questionRevisionId: QuestionRevisionId,
  body: Schema.NonEmptyString,
  isWithdrawn: Schema.Boolean,
  answerId: QuestionAnswerId,
  answerText: Schema.NonEmptyString,
})

const groupByPosition = <Row extends { readonly position: number }>(rows: ReadonlyArray<Row>) =>
  Arr.isReadonlyArrayNonEmpty(rows)
    ? Arr.groupWith(rows, (left, right) => left.position === right.position)
    : []

export const MockExamReaderLive = Layer.effect(
  MockExamReader,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const readBlueprint = (version: Statement.Statement<unknown>) =>
      Effect.gen(function* () {
        const [found] = yield* Effect.flatMap(
          version,
          Schema.decodeUnknownEffect(Schema.Array(BlueprintVersionRow)),
        )

        if (found === undefined) {
          return Option.none<ExamBlueprint>()
        }

        const rows =
          yield* sql`SELECT s.position,s.name,s.question_count,d.id AS document_id,d.title AS document_title
 FROM exam_blueprint_sections s
 LEFT JOIN exam_blueprint_section_documents sd ON sd.blueprint_id=s.blueprint_id AND sd.version=s.version AND sd.section_position=s.position
 LEFT JOIN reference_documents d ON d.id=sd.document_id
 WHERE s.blueprint_id=${found.id} AND s.version=${found.version}
 ORDER BY s.position,d.title,d.id`.pipe(
            Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(SectionDocumentRow))),
          )

        const sections = groupByPosition(rows).map(([first, ...rest]) => ({
          position: first.position,
          name: first.name,
          questionCount: first.questionCount,
          documents: [first, ...rest].flatMap(row =>
            row.documentId === null || row.documentTitle === null
              ? []
              : [{ id: row.documentId, title: row.documentTitle }],
          ),
        }))

        return Option.some<ExamBlueprint>({ ...found, sections })
      }).pipe(Effect.mapError(cause => new MockExamReadError({ cause })))

    const eligibleSectionQuestions = (
      pathId: QualificationPathId,
      blueprintId: ExamBlueprintId,
      version: ExamBlueprintVersion,
    ) =>
      sql`SELECT DISTINCT sd.section_position AS section,q.id AS question_id,q.current_revision_id AS question_revision_id
 FROM exam_blueprint_section_documents sd
 JOIN path_questions pq ON pq.qualification_path_id=${pathId} AND pq.document_id=sd.document_id
 JOIN written_questions q ON q.id=pq.question_id
 JOIN question_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 WHERE sd.blueprint_id=${blueprintId} AND sd.version=${version}`

    return MockExamReader.of({
      pathBlueprint: Effect.fn('MockExamReader.pathBlueprint')(pathId =>
        readBlueprint(
          sql`SELECT v.blueprint_id AS id,v.version,v.duration_minutes,v.pass_threshold
 FROM exam_blueprint_paths p JOIN exam_blueprint_versions v ON v.blueprint_id=p.blueprint_id
 WHERE p.qualification_path_id=${pathId} ORDER BY v.version DESC LIMIT 1`,
        ),
      ),
      blueprint: Effect.fn('MockExamReader.blueprint')(blueprintId =>
        readBlueprint(
          sql`SELECT blueprint_id AS id,version,duration_minutes,pass_threshold
 FROM exam_blueprint_versions WHERE blueprint_id=${blueprintId} ORDER BY version DESC LIMIT 1`,
        ),
      ),
      assignedPaths: Effect.fn('MockExamReader.assignedPaths')(
        function* (blueprintId) {
          const rows =
            yield* sql`SELECT qualification_path_id FROM exam_blueprint_paths WHERE blueprint_id=${blueprintId} ORDER BY qualification_path_id`

          const paths = yield* Schema.decodeUnknownEffect(
            Schema.Array(Schema.Struct({ qualificationPathId: QualificationPathId })),
          )(rows)

          return paths.map(path => path.qualificationPathId)
        },
        Effect.mapError(cause => new MockExamReadError({ cause })),
      ),
      pathDocumentIds: Effect.fn('MockExamReader.pathDocumentIds')(
        function* (pathId) {
          const rows =
            yield* sql`SELECT document_id FROM path_documents WHERE qualification_path_id=${pathId} ORDER BY document_id`

          const documents = yield* Schema.decodeUnknownEffect(
            Schema.Array(Schema.Struct({ documentId: ReferenceDocumentId })),
          )(rows)

          return documents.map(document => document.documentId)
        },
        Effect.mapError(cause => new MockExamReadError({ cause })),
      ),
      sectionEligibility: Effect.fn('MockExamReader.sectionEligibility')(
        function* (pathId, blueprintId, version) {
          const rows =
            yield* sql`WITH eligible AS (${eligibleSectionQuestions(pathId, blueprintId, version)})
 SELECT s.position,count(e.question_id)::integer AS available_question_count
 FROM exam_blueprint_sections s LEFT JOIN eligible e ON e.section=s.position
 WHERE s.blueprint_id=${blueprintId} AND s.version=${version}
 GROUP BY s.position ORDER BY s.position`

          return yield* Schema.decodeUnknownEffect(Schema.Array(SectionEligibilityRow))(rows)
        },
        Effect.mapError(cause => new MockExamReadError({ cause })),
      ),
      sectionCandidates: Effect.fn('MockExamReader.sectionCandidates')(
        function* (pathId, blueprintId, version) {
          const rows =
            yield* sql`WITH eligible AS (${eligibleSectionQuestions(pathId, blueprintId, version)})
 SELECT section,question_id,question_revision_id FROM eligible ORDER BY section,question_id`

          return yield* Schema.decodeUnknownEffect(Schema.Array(CandidateRow))(rows)
        },
        Effect.mapError(cause => new MockExamReadError({ cause })),
      ),
      candidateAnswers: Effect.fn('MockExamReader.candidateAnswers')(
        function* (revisionIds) {
          if (!Arr.isReadonlyArrayNonEmpty(revisionIds)) {
            return []
          }

          const rows =
            yield* sql`SELECT question_revision_id,id AS answer_id FROM question_answers WHERE question_revision_id IN ${sql.in(revisionIds)}
 ORDER BY question_revision_id,created_at,id`

          return yield* Schema.decodeUnknownEffect(Schema.Array(CandidateAnswerRow))(rows)
        },
        Effect.mapError(cause => new MockExamReadError({ cause })),
      ),
      unfinishedAttempt: Effect.fn('MockExamReader.unfinishedAttempt')(
        function* (userId, pathId) {
          const rows = yield* sql`SELECT id,status,started_at FROM mock_exam_attempts
 WHERE user_id=${userId} AND qualification_path_id=${pathId} AND status IN ${sql.in(unfinishedAttemptStatuses)} LIMIT 1`

          const attempts = yield* Schema.decodeUnknownEffect(Schema.Array(AttemptSummaryRow))(rows)

          return Arr.head<MockExamAttemptSummary>(attempts)
        },
        Effect.mapError(cause => new MockExamReadError({ cause })),
      ),
      attempt: Effect.fn('MockExamReader.attempt')(
        function* (userId, pathId, attemptId) {
          const [attempt] =
            yield* sql`SELECT a.id,a.status,a.started_at,a.blueprint_id,a.blueprint_version,v.duration_minutes,v.pass_threshold,
 (SELECT count(*)::integer FROM mock_exam_attempt_questions q WHERE q.attempt_id=a.id) AS question_count
 FROM mock_exam_attempts a JOIN exam_blueprint_versions v ON v.blueprint_id=a.blueprint_id AND v.version=a.blueprint_version
 WHERE a.id=${attemptId} AND a.user_id=${userId} AND a.qualification_path_id=${pathId} LIMIT 1`.pipe(
              Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(AttemptRow))),
            )

          if (attempt === undefined) {
            return Option.none()
          }

          const sections =
            yield* sql`SELECT position,name,question_count FROM exam_blueprint_sections
 WHERE blueprint_id=${attempt.blueprintId} AND version=${attempt.blueprintVersion} ORDER BY position`.pipe(
              Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(AttemptSectionRow))),
            )

          return Option.some({
            id: attempt.id,
            status: attempt.status,
            startedAt: attempt.startedAt,
            durationMinutes: attempt.durationMinutes,
            passThreshold: attempt.passThreshold,
            questionCount: attempt.questionCount,
            sections,
          })
        },
        Effect.mapError(cause => new MockExamReadError({ cause })),
      ),
      attemptQuestion: Effect.fn('MockExamReader.attemptQuestion')(
        function* (userId, pathId, attemptId, position) {
          const rows =
            yield* sql`SELECT q.position,q.section_position AS section,q.question_id,q.question_revision_id,r.body,r.withdrawn_at IS NOT NULL AS is_withdrawn,
 qa.id AS answer_id,qa.text AS answer_text
 FROM mock_exam_attempts a
 JOIN mock_exam_attempt_questions q ON q.attempt_id=a.id
 JOIN question_revisions r ON r.id=q.question_revision_id
 JOIN mock_exam_attempt_answer_options o ON o.attempt_id=q.attempt_id AND o.position=q.position
 JOIN question_answers qa ON qa.id=o.question_answer_id
 WHERE a.id=${attemptId} AND a.user_id=${userId} AND a.qualification_path_id=${pathId} AND q.position=${position}
 ORDER BY o.option_position LIMIT 3`.pipe(
              Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(AttemptQuestionRow))),
            )

          return Option.map(Arr.head(rows), (first): AttemptQuestion => ({
            position: first.position,
            section: first.section,
            questionId: first.questionId,
            questionRevisionId: first.questionRevisionId,
            body: first.body,
            isWithdrawn: first.isWithdrawn,
            answers: rows.map(row => ({ id: row.answerId, text: row.answerText })),
          }))
        },
        Effect.mapError(cause => new MockExamReadError({ cause })),
      ),
    })
  }),
)
