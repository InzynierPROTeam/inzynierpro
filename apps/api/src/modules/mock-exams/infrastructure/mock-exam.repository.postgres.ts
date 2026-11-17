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
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { Array as Arr, DateTime, Effect, Layer, Option, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import { MockExamWriteError } from '~api/modules/mock-exams/application/errors.js'
import { MockExamRepository } from '~api/modules/mock-exams/application/mock-exam.repository.js'

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
          const rows = yield* sql`SELECT status FROM mock_exam_attempts
 WHERE id=${attemptId} AND user_id=${userId} AND qualification_path_id=${pathId} LIMIT 1 FOR UPDATE`

          const attempts = yield* Schema.decodeUnknownEffect(
            Schema.Array(Schema.Struct({ status: MockExamAttemptStatus })),
          )(rows)

          return Option.map(Arr.head(attempts), attempt => attempt.status)
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
