import type { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import type {
  QuestionRevisionId,
  WrittenQuestionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import type { StudySessionId } from '@inzpro/domain/modules/study/study-session'
import { Array as Arr, Data, Effect, Layer, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import { StudyWriteError } from '~api/modules/study/application/errors.js'
import { StudyRepository } from '~api/modules/study/application/study.repository.js'
import { StudySession } from '~api/modules/study/domain/study-session.model.js'

// Keep the operation's generic error separate from SQL failures without changing rollback behavior.
class StudyTransactionFailure<E> extends Data.TaggedError('StudyTransactionFailure')<{
  readonly error: E
}> {}

type SessionQuestionInsert = {
  readonly studySessionId: StudySessionId
  readonly position: number
  readonly questionId: WrittenQuestionId
  readonly questionRevisionId: QuestionRevisionId
}

type AnswerOptionInsert = {
  readonly studySessionId: StudySessionId
  readonly position: number
  readonly questionRevisionId: QuestionRevisionId
  readonly optionPosition: number
  readonly questionAnswerId: QuestionAnswerId
}

export const StudyRepositoryLive = Layer.effect(
  StudyRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    return StudyRepository.of({
      transaction: Effect.fn('StudyRepository.transaction')(function* (operation) {
        return yield* sql
          .withTransaction(
            operation.pipe(Effect.mapError(error => new StudyTransactionFailure({ error }))),
          )
          .pipe(
            Effect.catchTags({
              SqlError: cause => Effect.fail(new StudyWriteError({ cause })),
              StudyTransactionFailure: failure => Effect.fail(failure.error),
            }),
          )
      }),
      createSession: Effect.fn('StudyRepository.createSession')(
        function* (session) {
          // One round trip returns the session in its read shape, so the command needs no read-back.
          const inserted =
            yield* sql`WITH s AS (INSERT INTO written_study_sessions (user_id,qualification_path_id,document_id,user_exam_goal_version,question_count)
 VALUES (${session.userId},${session.qualificationPathId},${session.documentId},${session.goalVersion},${session.questions.length})
 RETURNING id,document_id,question_count,current_position,created_at,ended_at)
 SELECT s.*,d.title AS document_title,0 AS answered_count FROM s JOIN reference_documents d ON d.id=s.document_id`

          const [created] = yield* Schema.decodeUnknownEffect(Schema.Tuple([StudySession]))(
            inserted,
          ).pipe(Effect.orDie)

          const id = created.id

          const questions: ReadonlyArray<SessionQuestionInsert> = session.questions.map(
            (question, index) => ({
              studySessionId: id,
              position: index + 1,
              questionId: question.questionId,
              questionRevisionId: question.questionRevisionId,
            }),
          )

          const options: ReadonlyArray<AnswerOptionInsert> = session.questions.flatMap(
            (question, index) =>
              question.answerIds.map((answerId, optionIndex) => ({
                studySessionId: id,
                position: index + 1,
                questionRevisionId: question.questionRevisionId,
                optionPosition: optionIndex + 1,
                questionAnswerId: answerId,
              })),
          )

          // An empty session fails the question_count check on insert above.
          if (Arr.isReadonlyArrayNonEmpty(questions)) {
            yield* sql`INSERT INTO written_study_session_questions ${sql.insert(questions)}`
          }

          if (Arr.isReadonlyArrayNonEmpty(options)) {
            yield* sql`INSERT INTO written_study_session_answer_options ${sql.insert(options)}`
          }

          return created
        },
        Effect.mapError(cause => new StudyWriteError({ cause })),
      ),
      recordCoverage: Effect.fn('StudyRepository.recordCoverage')(
        function* (userId, pathId, questionId, revisionId) {
          return yield* sql`INSERT INTO written_question_coverage (user_id,qualification_path_id,question_id,question_revision_id) VALUES (${userId},${pathId},${questionId},${revisionId}) ON CONFLICT (user_id,qualification_path_id,question_id) DO UPDATE SET question_revision_id=EXCLUDED.question_revision_id,covered_at=clock_timestamp()`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new StudyWriteError({ cause })),
          )
        },
      ),
    })
  }),
)
