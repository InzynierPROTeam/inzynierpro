import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import type {
  QuestionCount,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import type {
  QuestionRevisionId,
  WrittenQuestionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import {
  type ExamBlueprintId,
  type ExamBlueprintVersion,
  ExamDurationMinutes,
  type ExamSectionName,
  ExamSectionPosition,
} from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import {
  AttemptQuestionPosition,
  type AttemptQuestionVersion,
  initialAttemptQuestionVersion,
  inProgressAttempt,
  MockExamAttemptId,
  MockExamAttemptStatus,
  pausedAttempt,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { Array as Arr, DateTime, Effect, Layer, Option, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import { MockExamWriteError } from '~api/modules/mock-exams/application/errors.js'
import { MockExamRepository } from '~api/modules/mock-exams/application/mock-exam.repository.js'
import type { AttemptClock } from '~api/modules/mock-exams/domain/mock-exam-attempt.model.js'

const AttemptPauseRow = Schema.Struct({
  pausedAt: DateTimeUtc,
  endedAt: Schema.OptionFromNullOr(DateTimeUtc),
})

type SectionInsert = {
  readonly blueprintId: ExamBlueprintId
  readonly version: ExamBlueprintVersion
  readonly position: ExamSectionPosition
  readonly name: ExamSectionName
  readonly questionCount: QuestionCount
}

type SectionDocumentInsert = {
  readonly blueprintId: ExamBlueprintId
  readonly version: ExamBlueprintVersion
  readonly sectionPosition: ExamSectionPosition
  readonly documentId: ReferenceDocumentId
}

type AttemptQuestionInsert = {
  readonly attemptId: MockExamAttemptId
  readonly position: AttemptQuestionPosition
  readonly sectionPosition: ExamSectionPosition
  readonly questionId: WrittenQuestionId
  readonly questionRevisionId: QuestionRevisionId
  readonly version: AttemptQuestionVersion
}

type AnswerOptionInsert = {
  readonly attemptId: MockExamAttemptId
  readonly position: AttemptQuestionPosition
  readonly questionRevisionId: QuestionRevisionId
  readonly optionPosition: number
  readonly questionAnswerId: QuestionAnswerId
}

export const MockExamRepositoryLive = Layer.effect(
  MockExamRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    return MockExamRepository.of({
      finishAttempt: Effect.fn('MockExamRepository.finishAttempt')(
        function* (attemptId, ending, result) {
          const finished = DateTime.formatIso(ending.finishedAt)
          const passed = Option.getOrNull(result.passed)
          yield* sql`UPDATE mock_exam_attempt_questions q SET scored_withdrawn=r.withdrawn_at IS NOT NULL
 FROM question_revisions r WHERE q.attempt_id=${attemptId} AND r.id=q.question_revision_id`
          yield* sql`UPDATE mock_exam_attempt_pauses SET ended_at=${finished} WHERE attempt_id=${attemptId} AND ended_at IS NULL`
          yield* sql`UPDATE mock_exam_attempts SET status='finished',end_reason=${ending.endReason},finished_at=${finished},correct_count=${result.correct},incorrect_count=${result.incorrect},unanswered_count=${result.unanswered},percent=${result.percent},passed=${passed},active_seconds=${result.activeSeconds},pause_count=${result.pauseCount},pause_seconds=${result.pauseSeconds}
 WHERE id=${attemptId}`

          for (const section of result.sections) {
            yield* sql`INSERT INTO mock_exam_attempt_section_results (attempt_id,position,correct_count) VALUES (${attemptId},${section.position},${section.correct})`
          }
        },
        Effect.mapError(cause => new MockExamWriteError({ cause })),
      ),
      createBlueprint: Effect.fn('MockExamRepository.createBlueprint')(blueprintId =>
        sql`INSERT INTO exam_blueprints (id) VALUES (${blueprintId}) ON CONFLICT DO NOTHING`.pipe(
          Effect.asVoid,
          Effect.mapError(cause => new MockExamWriteError({ cause })),
        ),
      ),
      lockBlueprint: Effect.fn('MockExamRepository.lockBlueprint')(blueprintId =>
        sql`SELECT id FROM exam_blueprints WHERE id=${blueprintId} LIMIT 1 FOR UPDATE`.pipe(
          Effect.asVoid,
          Effect.mapError(cause => new MockExamWriteError({ cause })),
        ),
      ),
      insertBlueprintVersion: Effect.fn('MockExamRepository.insertBlueprintVersion')(
        function* (blueprint) {
          yield* sql`INSERT INTO exam_blueprint_versions (blueprint_id,version,duration_minutes,pass_threshold)
 VALUES (${blueprint.blueprintId},${blueprint.version},${blueprint.durationMinutes},${blueprint.passThreshold})`

          const sections: ReadonlyArray<SectionInsert> = blueprint.sections.map(
            (section, index) => ({
              blueprintId: blueprint.blueprintId,
              version: blueprint.version,
              position: ExamSectionPosition.make(index + 1),
              name: section.name,
              questionCount: section.questionCount,
            }),
          )

          const documents: ReadonlyArray<SectionDocumentInsert> = blueprint.sections.flatMap(
            (section, index) =>
              section.documentIds.map(documentId => ({
                blueprintId: blueprint.blueprintId,
                version: blueprint.version,
                sectionPosition: ExamSectionPosition.make(index + 1),
                documentId,
              })),
          )

          if (Arr.isReadonlyArrayNonEmpty(sections)) {
            yield* sql`INSERT INTO exam_blueprint_sections ${sql.insert(sections)}`
          }

          if (Arr.isReadonlyArrayNonEmpty(documents)) {
            yield* sql`INSERT INTO exam_blueprint_section_documents ${sql.insert(documents)}`
          }
        },
        Effect.mapError(cause => new MockExamWriteError({ cause })),
      ),
      assignBlueprint: Effect.fn('MockExamRepository.assignBlueprint')((pathId, blueprintId) =>
        sql`INSERT INTO exam_blueprint_paths (qualification_path_id,blueprint_id) VALUES (${pathId},${blueprintId})
 ON CONFLICT (qualification_path_id) DO UPDATE SET blueprint_id=EXCLUDED.blueprint_id`.pipe(
          Effect.asVoid,
          Effect.mapError(cause => new MockExamWriteError({ cause })),
        ),
      ),
      createAttempt: Effect.fn('MockExamRepository.createAttempt')(
        function* (attempt) {
          const startedAt = DateTime.formatIso(attempt.startedAt)

          const [created] =
            yield* sql`INSERT INTO mock_exam_attempts (user_id,qualification_path_id,blueprint_id,blueprint_version,status,started_at)
 VALUES (${attempt.userId},${attempt.qualificationPathId},${attempt.blueprintId},${attempt.blueprintVersion},${inProgressAttempt},${startedAt})
 RETURNING id`.pipe(
              Effect.flatMap(
                Schema.decodeUnknownEffect(
                  Schema.Tuple([Schema.Struct({ id: MockExamAttemptId })]),
                ),
              ),
            )

          const questions: ReadonlyArray<AttemptQuestionInsert> = attempt.questions.map(
            (question, index) => ({
              attemptId: created.id,
              position: AttemptQuestionPosition.make(index + 1),
              sectionPosition: question.section,
              questionId: question.questionId,
              questionRevisionId: question.questionRevisionId,
              version: initialAttemptQuestionVersion,
            }),
          )

          const options: ReadonlyArray<AnswerOptionInsert> = attempt.questions.flatMap(
            (question, index) =>
              question.answerIds.map((answerId, optionIndex) => ({
                attemptId: created.id,
                position: AttemptQuestionPosition.make(index + 1),
                questionRevisionId: question.questionRevisionId,
                optionPosition: optionIndex + 1,
                questionAnswerId: answerId,
              })),
          )

          if (Arr.isReadonlyArrayNonEmpty(questions)) {
            yield* sql`INSERT INTO mock_exam_attempt_questions ${sql.insert(questions)}`
          }

          if (Arr.isReadonlyArrayNonEmpty(options)) {
            yield* sql`INSERT INTO mock_exam_attempt_answer_options ${sql.insert(options)}`
          }

          return created.id
        },
        Effect.mapError(cause => new MockExamWriteError({ cause })),
      ),
      lockAttempt: Effect.fn('MockExamRepository.lockAttempt')(
        function* (userId, pathId, attemptId) {
          const rows =
            yield* sql`SELECT a.status,a.started_at,v.duration_minutes FROM mock_exam_attempts a
 JOIN exam_blueprint_versions v ON v.blueprint_id=a.blueprint_id AND v.version=a.blueprint_version
 WHERE a.id=${attemptId} AND a.user_id=${userId} AND a.qualification_path_id=${pathId} LIMIT 1 FOR UPDATE OF a`

          const [attempt] = yield* Schema.decodeUnknownEffect(
            Schema.Array(
              Schema.Struct({
                status: MockExamAttemptStatus,
                startedAt: DateTimeUtc,
                durationMinutes: ExamDurationMinutes,
              }),
            ),
          )(rows)

          if (attempt === undefined) {
            return Option.none()
          }

          const pauses =
            yield* sql`SELECT paused_at,ended_at FROM mock_exam_attempt_pauses WHERE attempt_id=${attemptId} ORDER BY paused_at,id`.pipe(
              Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(AttemptPauseRow))),
            )

          return Option.some<AttemptClock>({ ...attempt, pauses })
        },
        Effect.mapError(cause => new MockExamWriteError({ cause })),
      ),
      pauseAttempt: Effect.fn('MockExamRepository.pauseAttempt')(
        function* (attemptId, pausedAt) {
          const paused = DateTime.formatIso(pausedAt)
          yield* sql`UPDATE mock_exam_attempts SET status=${pausedAttempt} WHERE id=${attemptId}`
          yield* sql`INSERT INTO mock_exam_attempt_pauses (attempt_id,paused_at) VALUES (${attemptId},${paused})`
        },
        Effect.mapError(cause => new MockExamWriteError({ cause })),
      ),
      resumeAttempt: Effect.fn('MockExamRepository.resumeAttempt')(
        function* (attemptId, resumedAt) {
          const resumed = DateTime.formatIso(resumedAt)
          yield* sql`UPDATE mock_exam_attempt_pauses SET ended_at=${resumed} WHERE attempt_id=${attemptId} AND ended_at IS NULL`
          yield* sql`UPDATE mock_exam_attempts SET status=${inProgressAttempt} WHERE id=${attemptId}`
        },
        Effect.mapError(cause => new MockExamWriteError({ cause })),
      ),
      saveAttemptAnswer: Effect.fn('MockExamRepository.saveAttemptAnswer')(
        (attemptId, position, answerId, version) =>
          sql`UPDATE mock_exam_attempt_questions SET selected_answer_id=${answerId},version=${version}
 WHERE attempt_id=${attemptId} AND position=${position}`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new MockExamWriteError({ cause })),
          ),
      ),
      flagAttemptQuestion: Effect.fn('MockExamRepository.flagAttemptQuestion')(
        (attemptId, position, isFlagged, version) =>
          sql`UPDATE mock_exam_attempt_questions SET is_flagged=${isFlagged},version=${version}
 WHERE attempt_id=${attemptId} AND position=${position}`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new MockExamWriteError({ cause })),
          ),
      ),
    })
  }),
)
