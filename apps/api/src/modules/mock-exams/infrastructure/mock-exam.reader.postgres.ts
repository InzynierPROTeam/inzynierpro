import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { Percent } from '@inzpro/domain/common/percent'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import {
  QuestionCount,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import {
  QuestionRevisionId,
  WrittenQuestionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import {
  ExamBlueprintId,
  ExamBlueprintVersion,
  ExamDurationMinutes,
  ExamSectionName,
  ExamSectionPosition,
} from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import {
  ExamActiveSeconds,
  ExamPauseCount,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import {
  AttemptQuestionPosition,
  AttemptQuestionVersion,
  MockExamAttemptId,
  MockExamAttemptStatus,
  MockExamEndReason,
  unfinishedAttemptStatuses,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { RichContent } from '@inzpro/rich-content/rich-content'
import { Array as Arr, DateTime, Effect, Layer, Option, Schema } from 'effect'
import { SqlClient, type Statement } from 'effect/sql'
import { makeCursorPaginator, mapCursorPage } from '~api/lib/cursor-pagination.js'
import { QuestionNote } from '~api/modules/learning/domain/question-note.model.js'
import { MockExamReadError } from '~api/modules/mock-exams/application/errors.js'
import { MockExamReader } from '~api/modules/mock-exams/application/mock-exam.reader.js'
import type { ExamBlueprint } from '~api/modules/mock-exams/domain/exam-blueprint.model.js'
import {
  type AttemptScoreCounts,
  type AttemptReviewQuestion,
  FinalAttemptAnswer,
} from '~api/modules/mock-exams/domain/mock-exam-attempt.model.js'
import type {
  AttemptQuestion,
  MockExamAttemptSummary,
} from '~api/modules/mock-exams/domain/mock-exam-attempt.model.js'
import { attemptDeadline } from '~api/modules/mock-exams/domain/mock-exam-clock.rules.js'

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
  earnedXp: LearningXp,
  id: MockExamAttemptId,
  status: MockExamAttemptStatus,
  startedAt: DateTimeUtc,
  finishedAt: Schema.OptionFromNullOr(DateTimeUtc),
  endReason: Schema.OptionFromNullOr(MockExamEndReason),
  correctCount: Schema.NullOr(QuestionCount),
  incorrectCount: Schema.NullOr(QuestionCount),
  unansweredCount: Schema.NullOr(QuestionCount),
  percent: Schema.NullOr(Percent),
  passed: Schema.OptionFromNullOr(Schema.Boolean),
  activeSeconds: Schema.NullOr(ExamActiveSeconds),
  pauseCount: Schema.NullOr(ExamPauseCount),
  pauseSeconds: Schema.NullOr(ExamActiveSeconds),
})

const AttemptPauseRow = Schema.Struct({
  pausedAt: DateTimeUtc,
  endedAt: Schema.OptionFromNullOr(DateTimeUtc),
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

const AttemptQuestionStateRow = Schema.Struct({
  position: AttemptQuestionPosition,
  isAnswered: Schema.Boolean,
  isFlagged: Schema.Boolean,
})

const AttemptQuestionRow = Schema.Struct({
  position: AttemptQuestionPosition,
  section: ExamSectionPosition,
  questionId: WrittenQuestionId,
  questionRevisionId: QuestionRevisionId,
  body: Schema.NonEmptyString,
  isWithdrawn: Schema.Boolean,
  selectedAnswerId: Schema.NullOr(QuestionAnswerId),
  isFlagged: Schema.Boolean,
  version: AttemptQuestionVersion,
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

    const toQuestion = (
      rows: ReadonlyArray<typeof AttemptQuestionRow.Type>,
    ): Option.Option<AttemptQuestion> =>
      Option.map(Arr.head(rows), first => ({
        position: first.position,
        section: first.section,
        questionId: first.questionId,
        questionRevisionId: first.questionRevisionId,
        body: first.body,
        isWithdrawn: first.isWithdrawn,
        answers: rows.map(row => ({ id: row.answerId, text: row.answerText })),
        selectedAnswerId: Option.fromNullOr(first.selectedAnswerId),
        isFlagged: first.isFlagged,
        version: first.version,
      }))

    const readQuestionRows = (
      userId: UserId,
      pathId: QualificationPathId,
      attemptId: MockExamAttemptId,
      positions: ReadonlyArray<AttemptQuestionPosition>,
    ) =>
      positions.length === 0
        ? Effect.succeed([])
        : sql`SELECT q.position,q.section_position AS section,q.question_id,q.question_revision_id,r.body,coalesce(q.scored_withdrawn,r.withdrawn_at IS NOT NULL) AS is_withdrawn,
 q.selected_answer_id,q.is_flagged,q.version,qa.id AS answer_id,qa.text AS answer_text
 FROM mock_exam_attempts a
 JOIN mock_exam_attempt_questions q ON q.attempt_id=a.id
 JOIN question_revisions r ON r.id=q.question_revision_id
 JOIN mock_exam_attempt_answer_options o ON o.attempt_id=q.attempt_id AND o.position=q.position
 JOIN question_answers qa ON qa.id=o.question_answer_id
 WHERE a.id=${attemptId} AND a.user_id=${userId} AND a.qualification_path_id=${pathId} AND q.position IN ${sql.in(positions)}
 ORDER BY q.position,o.option_position LIMIT ${positions.length * 3}`.pipe(
            Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(AttemptQuestionRow))),
            Effect.mapError(cause => new MockExamReadError({ cause })),
          )

    const readQuestion: MockExamReader['Service']['attemptQuestion'] = Effect.fn(
      'MockExamReader.attemptQuestion',
    )((userId, pathId, attemptId, position) =>
      readQuestionRows(userId, pathId, attemptId, [position]).pipe(Effect.map(toQuestion)),
    )

    const summaryColumns = sql.literal(
      'a.earned_xp,a.id,a.status,a.started_at,a.finished_at,a.end_reason,a.correct_count,a.incorrect_count,a.unanswered_count,a.percent,a.passed,a.active_seconds,a.pause_count,a.pause_seconds',
    )

    const sectionResultRow = Schema.Struct({
      position: ExamSectionPosition,
      name: ExamSectionName,
      questionCount: QuestionCount,
      correct: QuestionCount,
    })

    const readSummary = (
      row: typeof AttemptSummaryRow.Type,
      sections: ReadonlyArray<typeof sectionResultRow.Type>,
    ): MockExamAttemptSummary => ({
      id: row.id,
      earnedXp: row.earnedXp,
      status: row.status,
      startedAt: row.startedAt,
      finishedAt: row.finishedAt,
      endReason: row.endReason,
      pauseCount: row.pauseCount ?? ExamPauseCount.make(0),
      pauseSeconds: row.pauseSeconds ?? ExamActiveSeconds.make(0),
      result:
        row.correctCount === null ||
        row.incorrectCount === null ||
        row.unansweredCount === null ||
        row.percent === null ||
        row.activeSeconds === null ||
        row.pauseCount === null ||
        row.pauseSeconds === null
          ? Option.none()
          : Option.some({
              correct: row.correctCount,
              incorrect: row.incorrectCount,
              unanswered: row.unansweredCount,
              percent: row.percent,
              passed: row.passed,
              activeSeconds: row.activeSeconds,
              pauseCount: row.pauseCount,
              pauseSeconds: row.pauseSeconds,
              sections,
            }),
    })

    const storedSections = (attemptIds: ReadonlyArray<MockExamAttemptId>) =>
      sql`SELECT sr.attempt_id,s.position,s.name,sr.question_count,sr.correct_count AS correct
 FROM mock_exam_attempt_section_results sr JOIN mock_exam_attempts a ON a.id=sr.attempt_id
 JOIN exam_blueprint_sections s ON s.blueprint_id=a.blueprint_id AND s.version=a.blueprint_version AND s.position=sr.position
 WHERE sr.attempt_id IN ${sql.in(attemptIds)} ORDER BY sr.attempt_id,s.position`.pipe(
        Effect.flatMap(
          Schema.decodeUnknownEffect(
            Schema.Array(
              Schema.Struct({ ...sectionResultRow.fields, attemptId: MockExamAttemptId }),
            ),
          ),
        ),
      )

    const historyPage = makeCursorPaginator(
      sql,
      Schema.Struct({ startedAt: DateTimeUtc, id: MockExamAttemptId }),
      [
        ['startedAt', sql`a.started_at`, 'desc'],
        ['id', sql`a.id`, 'desc'],
      ],
    )

    const reviewPage = makeCursorPaginator(
      sql,
      Schema.Struct({ position: AttemptQuestionPosition }),
      [['position', sql`q.position`, 'asc']],
    )

    const reviewRow = Schema.Struct({
      position: AttemptQuestionPosition,
      correctAnswerId: QuestionAnswerId,
      explanation: RichContent,
      isFavorite: Schema.Boolean,
      noteText: Schema.NullOr(QuestionNote.fields.text),
      noteUpdatedAt: Schema.OptionFromNullOr(DateTimeUtc),
      refersToEarlierWording: Schema.Boolean,
    })

    return MockExamReader.of({
      scoreAttempt: Effect.fn('MockExamReader.scoreAttempt')(
        function* (userId, pathId, attemptId) {
          const [row] =
            yield* sql`SELECT v.pass_threshold, count(q.position) FILTER (WHERE r.withdrawn_at IS NULL)::integer AS total,
 count(q.position) FILTER (WHERE qa.is_correct AND r.withdrawn_at IS NULL)::integer AS correct,
 count(q.position) FILTER (WHERE q.selected_answer_id IS NULL AND r.withdrawn_at IS NULL)::integer AS unanswered,
 count(q.position) FILTER (WHERE r.withdrawn_at IS NOT NULL)::integer AS withdrawn
 FROM mock_exam_attempts a JOIN exam_blueprint_versions v ON v.blueprint_id=a.blueprint_id AND v.version=a.blueprint_version
 JOIN mock_exam_attempt_questions q ON q.attempt_id=a.id JOIN question_revisions r ON r.id=q.question_revision_id
 LEFT JOIN question_answers qa ON qa.id=q.selected_answer_id
 WHERE a.id=${attemptId} AND a.user_id=${userId} AND a.qualification_path_id=${pathId}
 GROUP BY a.id,v.pass_threshold`.pipe(
              Effect.flatMap(
                Schema.decodeUnknownEffect(
                  Schema.Array(
                    Schema.Struct({
                      passThreshold: QuestionCount,
                      total: QuestionCount,
                      correct: QuestionCount,
                      unanswered: QuestionCount,
                      withdrawn: QuestionCount,
                    }),
                  ),
                ),
              ),
            )

          if (row === undefined) {
            return Option.none()
          }

          const sections =
            yield* sql`SELECT s.position,s.name,count(q.position) FILTER (WHERE r.withdrawn_at IS NULL)::integer AS question_count,count(q.position) FILTER (WHERE qa.is_correct AND r.withdrawn_at IS NULL)::integer AS correct
 FROM mock_exam_attempts a JOIN exam_blueprint_sections s ON s.blueprint_id=a.blueprint_id AND s.version=a.blueprint_version
 JOIN mock_exam_attempt_questions q ON q.attempt_id=a.id AND q.section_position=s.position
 JOIN question_revisions r ON r.id=q.question_revision_id LEFT JOIN question_answers qa ON qa.id=q.selected_answer_id
 WHERE a.id=${attemptId} GROUP BY s.position,s.name,s.question_count ORDER BY s.position`.pipe(
              Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(sectionResultRow))),
            )

          return Option.some<AttemptScoreCounts>({ ...row, sections })
        },
        Effect.mapError(cause => new MockExamReadError({ cause })),
      ),
      finalAnswers: Effect.fn('MockExamReader.finalAnswers')(
        function* (attemptId) {
          const rows =
            yield* sql`SELECT q.position,q.question_id,q.question_revision_id,qa.is_correct,a.user_exam_goal_version AS goal_version
 FROM mock_exam_attempts a JOIN mock_exam_attempt_questions q ON q.attempt_id=a.id
 JOIN question_revisions r ON r.id=q.question_revision_id AND r.withdrawn_at IS NULL
 JOIN question_answers qa ON qa.id=q.selected_answer_id
 WHERE a.id=${attemptId} ORDER BY q.position`

          return yield* Schema.decodeUnknownEffect(Schema.Array(FinalAttemptAnswer))(rows)
        },
        Effect.mapError(cause => new MockExamReadError({ cause })),
      ),
      history: Effect.fn('MockExamReader.history')(
        function* (userId, pathId, page) {
          const result = yield* historyPage(
            page,
            window =>
              sql`SELECT ${summaryColumns} FROM mock_exam_attempts a
 WHERE a.user_id=${userId} AND a.qualification_path_id=${pathId} AND ${window.after} ORDER BY ${window.orderBy} LIMIT ${window.limit}`.pipe(
                Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(AttemptSummaryRow))),
              ),
            row => ({ startedAt: row.startedAt, id: row.id }),
          )

          const sections =
            result.data.length === 0 ? [] : yield* storedSections(result.data.map(row => row.id))

          return mapCursorPage(result, row =>
            readSummary(
              row,
              sections.filter(section => section.attemptId === row.id),
            ),
          )
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new MockExamReadError({ cause })),
          SchemaError: cause => Effect.fail(new MockExamReadError({ cause })),
        }),
      ),
      review: Effect.fn('MockExamReader.review')(
        function* (userId, pathId, attemptId, page) {
          const result = yield* reviewPage(
            page,
            window =>
              sql`SELECT q.position,qa.id AS correct_answer_id,r.explanation,
 EXISTS (SELECT 1 FROM written_favorite_questions f WHERE f.user_id=a.user_id AND f.question_id=q.question_id) AS is_favorite,
 n.body AS note_text,n.updated_at AS note_updated_at,coalesce(n.question_revision_id<>q.question_revision_id,false) AS refers_to_earlier_wording
 FROM mock_exam_attempts a JOIN mock_exam_attempt_questions q ON q.attempt_id=a.id
 JOIN question_revisions r ON r.id=q.question_revision_id JOIN question_answers qa ON qa.question_revision_id=r.id AND qa.is_correct
 LEFT JOIN written_question_notes n ON n.user_id=a.user_id AND n.question_id=q.question_id
 WHERE a.id=${attemptId} AND a.user_id=${userId} AND a.qualification_path_id=${pathId} AND a.status='finished' AND ${window.after}
 ORDER BY ${window.orderBy} LIMIT ${window.limit}`.pipe(
                Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(reviewRow))),
              ),
            row => ({ position: row.position }),
          )

          const questionRows = yield* readQuestionRows(
            userId,
            pathId,
            attemptId,
            result.data.map(row => row.position),
          )

          const data = yield* Effect.forEach(result.data, row =>
            Effect.gen(function* () {
              const question = toQuestion(
                questionRows.filter(questionRow => questionRow.position === row.position),
              )

              if (Option.isNone(question)) {
                return yield* Effect.die(new Error('Missing pinned exam question'))
              }

              return {
                ...question.value,
                correctAnswerId: row.correctAnswerId,
                explanation: row.explanation,
                isFavorite: row.isFavorite,
                note: Option.map(
                  Option.all({
                    text: Option.fromNullOr(row.noteText),
                    updatedAt: row.noteUpdatedAt,
                  }),
                  note => ({ ...note, refersToEarlierWording: row.refersToEarlierWording }),
                ),
              } satisfies AttemptReviewQuestion
            }),
          )

          return { ...result, data }
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new MockExamReadError({ cause })),
          SchemaError: cause => Effect.fail(new MockExamReadError({ cause })),
        }),
      ),
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
          const rows = yield* sql`SELECT ${summaryColumns} FROM mock_exam_attempts a
 WHERE user_id=${userId} AND qualification_path_id=${pathId} AND status IN ${sql.in(unfinishedAttemptStatuses)} LIMIT 1`

          const attempts = yield* Schema.decodeUnknownEffect(Schema.Array(AttemptSummaryRow))(rows)

          return Option.map(Arr.head(attempts), row => readSummary(row, []))
        },
        Effect.mapError(cause => new MockExamReadError({ cause })),
      ),
      attempt: Effect.fn('MockExamReader.attempt')(
        function* (userId, pathId, attemptId) {
          const [attempt] =
            yield* sql`SELECT ${summaryColumns},a.blueprint_id,a.blueprint_version,v.duration_minutes,v.pass_threshold,
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

          const questions =
            yield* sql`SELECT position,selected_answer_id IS NOT NULL AS is_answered,is_flagged FROM mock_exam_attempt_questions
 WHERE attempt_id=${attempt.id} ORDER BY position`.pipe(
              Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(AttemptQuestionStateRow))),
            )

          const resultSections = yield* storedSections([attempt.id])

          const pauses =
            yield* sql`SELECT paused_at,ended_at FROM mock_exam_attempt_pauses WHERE attempt_id=${attempt.id} ORDER BY paused_at,id`.pipe(
              Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(AttemptPauseRow))),
            )

          return Option.some({
            ...readSummary(attempt, resultSections),
            deadline: attemptDeadline({ ...attempt, pauses }, yield* DateTime.now),
            durationMinutes: attempt.durationMinutes,
            passThreshold: attempt.passThreshold,
            questionCount: attempt.questionCount,
            sections,
            questions,
          })
        },
        Effect.mapError(cause => new MockExamReadError({ cause })),
      ),
      attemptStatus: Effect.fn('MockExamReader.attemptStatus')(
        function* (userId, pathId, attemptId) {
          const rows =
            yield* sql`SELECT status FROM mock_exam_attempts WHERE id=${attemptId} AND user_id=${userId} AND qualification_path_id=${pathId} LIMIT 1`

          const attempts = yield* Schema.decodeUnknownEffect(
            Schema.Array(Schema.Struct({ status: MockExamAttemptStatus })),
          )(rows)

          return Option.map(Arr.head(attempts), attempt => attempt.status)
        },
        Effect.mapError(cause => new MockExamReadError({ cause })),
      ),
      attemptQuestion: readQuestion,
    })
  }),
)
