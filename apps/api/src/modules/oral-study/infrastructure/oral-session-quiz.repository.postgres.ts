import type {
  OralKnowledgeCheckOptionId,
  OralKnowledgeCheckRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-knowledge-check'
import type { OralRevisionId } from '@inzpro/domain/modules/learning-content/oral-question'
import { OralSessionQuizId } from '@inzpro/domain/modules/oral-study/oral-session-quiz'
import type { OralStudySessionId } from '@inzpro/domain/modules/oral-study/oral-study-session'
import { Array as Arr, DateTime, Effect, Layer, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import { StudyWriteError } from '~api/modules/oral-study/application/errors.js'
import { OralSessionQuizRepository } from '~api/modules/oral-study/application/oral-session-quiz.repository.js'

type QuizCheckInsert = {
  readonly quizId: OralSessionQuizId
  readonly position: number
  readonly studySessionId: OralStudySessionId
  readonly sessionPosition: number
  readonly oralRevisionId: OralRevisionId
  readonly knowledgeCheckRevisionId: OralKnowledgeCheckRevisionId
}

type QuizOptionInsert = {
  readonly quizId: OralSessionQuizId
  readonly position: number
  readonly knowledgeCheckRevisionId: OralKnowledgeCheckRevisionId
  readonly optionPosition: number
  readonly optionId: OralKnowledgeCheckOptionId
}

type QuizAnswerOptionInsert = {
  readonly quizId: OralSessionQuizId
  readonly position: number
  readonly optionId: OralKnowledgeCheckOptionId
}

export const OralSessionQuizRepositoryLive = Layer.effect(
  OralSessionQuizRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    return OralSessionQuizRepository.of({
      createQuiz: Effect.fn('OralSessionQuizRepository.createQuiz')(
        function* (quiz) {
          const rows =
            yield* sql`INSERT INTO oral_session_quizzes (study_session_id) VALUES (${quiz.sessionId}) RETURNING id`

          const [{ id }] = yield* Schema.decodeUnknownEffect(
            Schema.Tuple([Schema.Struct({ id: OralSessionQuizId })]),
          )(rows)

          const checks: ReadonlyArray<QuizCheckInsert> = quiz.checks.map((check, index) => ({
            quizId: id,
            position: index + 1,
            studySessionId: quiz.sessionId,
            sessionPosition: check.sessionPosition,
            oralRevisionId: check.oralRevisionId,
            knowledgeCheckRevisionId: check.knowledgeCheckRevisionId,
          }))

          const options: ReadonlyArray<QuizOptionInsert> = quiz.checks.flatMap((check, index) =>
            check.optionIds.map((optionId, optionIndex) => ({
              quizId: id,
              position: index + 1,
              knowledgeCheckRevisionId: check.knowledgeCheckRevisionId,
              optionPosition: optionIndex + 1,
              optionId,
            })),
          )

          if (Arr.isReadonlyArrayNonEmpty(checks)) {
            yield* sql`INSERT INTO oral_session_quiz_checks ${sql.insert(checks)}`
          }

          if (Arr.isReadonlyArrayNonEmpty(options)) {
            yield* sql`INSERT INTO oral_session_quiz_options ${sql.insert(options)}`
          }
        },
        Effect.mapError(cause => new StudyWriteError({ cause })),
      ),
      recordAnswer: Effect.fn('OralSessionQuizRepository.recordAnswer')(
        function* (quizId, position, answer) {
          yield* sql`INSERT INTO oral_session_quiz_answers (quiz_id,position,is_correct,answered_at) VALUES (${quizId},${position},${answer.isCorrect},${DateTime.formatIso(answer.answeredAt)})`

          const selected: ReadonlyArray<QuizAnswerOptionInsert> = answer.selectedOptionIds.map(
            optionId => ({ quizId, position, optionId }),
          )

          if (Arr.isReadonlyArrayNonEmpty(selected)) {
            yield* sql`INSERT INTO oral_session_quiz_answer_options ${sql.insert(selected)}`
          }
        },
        Effect.mapError(cause => new StudyWriteError({ cause })),
      ),
    })
  }),
)
