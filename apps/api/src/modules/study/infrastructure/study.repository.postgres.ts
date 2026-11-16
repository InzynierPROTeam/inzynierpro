import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import type {
  QuestionRevisionId,
  WrittenQuestionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import type { StudySessionId } from '@inzpro/domain/modules/study/study-session'
import { Array as Arr, Data, DateTime, Effect, Layer, Option, Predicate, Schema } from 'effect'
import { SqlClient, type Statement } from 'effect/sql'
import { QuestionNoteWriteError, StudyWriteError } from '~api/modules/study/application/errors.js'
import { StudyRepository } from '~api/modules/study/application/study.repository.js'
import { QuestionNote } from '~api/modules/study/domain/question-note.model.js'
import { LearningEventId } from '~api/modules/study/domain/review-state.model.js'
import { StudySession } from '~api/modules/study/domain/study-session.model.js'

// Keep the operation's generic error separate from SQL failures without changing rollback behavior.
class StudyTransactionFailure<E> extends Data.TaggedError('StudyTransactionFailure')<{
  readonly error: E
}> {}

const LearningEventRow = Schema.Struct({ id: LearningEventId })

const OpeningRow = Schema.Struct({ openedAt: DateTimeUtc })

const AnswerRow = Schema.Struct({
  answerId: QuestionAnswerId,
  isCorrect: Schema.Boolean,
  isAssisted: Schema.Boolean,
  answeredAt: DateTimeUtc,
})

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

    const updateSession = (update: Statement.Fragment) =>
      sql`WITH s AS (${update} RETURNING id,kind,document_id,user_exam_goal_version AS goal_version,question_count,current_position,created_at,ended_at)
 SELECT s.*,d.title AS document_title,(SELECT count(*)::integer FROM written_study_answers a WHERE a.study_session_id=s.id) AS answered_count,
 (SELECT count(*)::integer FROM written_study_session_questions sq JOIN question_revisions r ON r.id=sq.question_revision_id WHERE sq.study_session_id=s.id AND r.withdrawn_at<coalesce(s.ended_at,'infinity') AND NOT EXISTS (SELECT 1 FROM written_study_answers a WHERE a.study_session_id=sq.study_session_id AND a.position=sq.position)) AS skipped_count
 FROM s LEFT JOIN reference_documents d ON d.id=s.document_id`.pipe(
        Effect.flatMap(Schema.decodeUnknownEffect(Schema.Tuple([StudySession]))),
        Effect.map(([session]) => session),
        Effect.mapError(cause => new StudyWriteError({ cause })),
      )

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
          const documentId = Option.getOrNull(session.documentId)

          const inserted =
            yield* sql`WITH s AS (INSERT INTO written_study_sessions (user_id,qualification_path_id,kind,document_id,user_exam_goal_version,question_count)
 VALUES (${session.userId},${session.qualificationPathId},${session.kind},${documentId},${session.goalVersion},${session.questions.length})
 RETURNING id,kind,document_id,user_exam_goal_version AS goal_version,question_count,current_position,created_at,ended_at)
 SELECT s.*,d.title AS document_title,0 AS answered_count,0 AS skipped_count FROM s LEFT JOIN reference_documents d ON d.id=s.document_id`

          const [created] = yield* Schema.decodeUnknownEffect(Schema.Tuple([StudySession]))(
            inserted,
          )

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
      markFavorite: Effect.fn('StudyRepository.markFavorite')((userId, questionId) =>
        sql`INSERT INTO written_favorite_questions (user_id,question_id) VALUES (${userId},${questionId}) ON CONFLICT DO NOTHING`.pipe(
          Effect.asVoid,
          Effect.mapError(cause => new StudyWriteError({ cause })),
        ),
      ),
      unmarkFavorite: Effect.fn('StudyRepository.unmarkFavorite')((userId, questionId) =>
        sql`DELETE FROM written_favorite_questions WHERE user_id=${userId} AND question_id=${questionId}`.pipe(
          Effect.asVoid,
          Effect.mapError(cause => new StudyWriteError({ cause })),
        ),
      ),
      recordExplanationOpening: Effect.fn('StudyRepository.recordExplanationOpening')(
        function* (sessionId, position) {
          const rows =
            yield* sql`UPDATE written_study_session_questions SET explanation_opened_at=now() WHERE study_session_id=${sessionId} AND position=${position} AND explanation_opened_at IS NULL
 RETURNING explanation_opened_at AS opened_at`

          const [opened] = yield* Schema.decodeUnknownEffect(Schema.Tuple([OpeningRow]))(rows)

          return opened.openedAt
        },
        Effect.mapError(cause => new StudyWriteError({ cause })),
      ),
      recordNoteOpening: Effect.fn('StudyRepository.recordNoteOpening')(
        function* (sessionId, position) {
          const rows =
            yield* sql`UPDATE written_study_session_questions SET note_opened_at=now() WHERE study_session_id=${sessionId} AND position=${position} AND note_opened_at IS NULL
 RETURNING note_opened_at AS opened_at`

          const [opened] = yield* Schema.decodeUnknownEffect(Schema.Tuple([OpeningRow]))(rows)

          return opened.openedAt
        },
        Effect.mapError(cause => new StudyWriteError({ cause })),
      ),
      saveNote: Effect.fn('StudyRepository.saveNote')(
        function* (userId, questionId, text) {
          // The note keeps the revision current now, so it reads as current until a substantive one.
          const rows =
            yield* sql`INSERT INTO written_question_notes (user_id,question_id,question_revision_id,body)
 SELECT ${userId},q.id,q.current_revision_id,${text} FROM written_questions q WHERE q.id=${questionId}
 ON CONFLICT (user_id,question_id) DO UPDATE SET body=EXCLUDED.body,question_revision_id=EXCLUDED.question_revision_id
 RETURNING body AS text,updated_at,false AS refers_to_earlier_wording`

          const [stored] = yield* Schema.decodeUnknownEffect(Schema.Tuple([QuestionNote]))(rows)

          return stored
        },
        // A constraint error's detail may quote the row, so only the kind of failure is kept.
        Effect.mapError(
          error =>
            new QuestionNoteWriteError({
              reason: Predicate.isTagged(error, 'SqlError') ? error.reason._tag : error._tag,
            }),
        ),
      ),
      clearNote: Effect.fn('StudyRepository.clearNote')((userId, questionId) =>
        sql`DELETE FROM written_question_notes WHERE user_id=${userId} AND question_id=${questionId}`.pipe(
          Effect.asVoid,
          Effect.mapError(cause => new StudyWriteError({ cause })),
        ),
      ),
      recordAnswer: Effect.fn('StudyRepository.recordAnswer')(
        function* (answer) {
          const rows =
            yield* sql`INSERT INTO written_study_answers (study_session_id,position,question_revision_id,question_answer_id,is_correct,is_assisted)
 VALUES (${answer.sessionId},${answer.position},${answer.questionRevisionId},${answer.answerId},${answer.isCorrect},${answer.isAssisted})
 RETURNING question_answer_id AS answer_id,is_correct,is_assisted,created_at AS answered_at`

          const [stored] = yield* Schema.decodeUnknownEffect(Schema.Tuple([AnswerRow]))(rows)

          return stored
        },
        Effect.mapError(cause => new StudyWriteError({ cause })),
      ),
      recordLearningEvent: Effect.fn('StudyRepository.recordLearningEvent')(
        function* (answer, context) {
          const answeredAt = DateTime.formatIso(context.answeredAt)

          const rows =
            yield* sql`INSERT INTO written_learning_events (user_id,qualification_path_id,user_exam_goal_version,question_id,question_revision_id,mode,is_correct,assistance,answered_at,study_session_id,position)
 VALUES (${answer.userId},${answer.qualificationPathId},${answer.goalVersion},${answer.questionId},${answer.questionRevisionId},${context.mode},${answer.isCorrect},${context.assistance},${answeredAt},${answer.sessionId},${answer.position})
 RETURNING id`

          const [event] = yield* Schema.decodeUnknownEffect(Schema.Tuple([LearningEventRow]))(rows)

          return event.id
        },
        Effect.mapError(cause => new StudyWriteError({ cause })),
      ),
      storeReviewState: Effect.fn('StudyRepository.storeReviewState')(function* (state) {
        const { card } = state
        const dueAt = DateTime.formatIso(card.dueAt)

        const lastReviewAt = Option.map(card.lastReviewAt, DateTime.formatIso).pipe(
          Option.getOrNull,
        )

        // The state belongs to the substantive content of the answered revision.
        return yield* sql`INSERT INTO written_review_states (user_id,qualification_path_id,question_id,substantive_revision_id,learning_event_id,rules_version,due_at,last_review_at,stability,stability_fast,difficulty,state,schedule_status,reps,lapses,scheduled_days,learning_step)
 SELECT ${state.userId},${state.qualificationPathId},${state.questionId},r.substantive_revision_id,${state.learningEventId},${state.rulesVersion},${dueAt},${lastReviewAt},${card.stability},${card.stabilityFast},${card.difficulty},${card.state},${card.scheduleStatus},${card.reps},${card.lapses},${card.scheduledDays},${card.learningStep}
 FROM question_revisions r WHERE r.id=${state.questionRevisionId} AND r.question_id=${state.questionId}
 ON CONFLICT (user_id,qualification_path_id,question_id) DO UPDATE SET substantive_revision_id=EXCLUDED.substantive_revision_id,learning_event_id=EXCLUDED.learning_event_id,rules_version=EXCLUDED.rules_version,due_at=EXCLUDED.due_at,last_review_at=EXCLUDED.last_review_at,stability=EXCLUDED.stability,stability_fast=EXCLUDED.stability_fast,difficulty=EXCLUDED.difficulty,state=EXCLUDED.state,schedule_status=EXCLUDED.schedule_status,reps=EXCLUDED.reps,lapses=EXCLUDED.lapses,scheduled_days=EXCLUDED.scheduled_days,learning_step=EXCLUDED.learning_step
 RETURNING 1`.pipe(
          // A revision outside the question stores nothing, which must not pass silently.
          Effect.flatMap(Schema.decodeUnknownEffect(Schema.Tuple([Schema.Unknown]))),
          Effect.asVoid,
          Effect.mapError(cause => new StudyWriteError({ cause })),
        )
      }),
      moveSession: Effect.fn('StudyRepository.moveSession')((sessionId, currentPosition) =>
        updateSession(
          sql`UPDATE written_study_sessions SET current_position=${currentPosition},last_activity_at=now() WHERE id=${sessionId}`,
        ),
      ),
      endSession: Effect.fn('StudyRepository.endSession')(sessionId =>
        updateSession(
          sql`UPDATE written_study_sessions SET ended_at=now() WHERE id=${sessionId} AND ended_at IS NULL`,
        ),
      ),
      recordCoverage: Effect.fn('StudyRepository.recordCoverage')(
        function* (userId, pathId, questionId, revisionId, round) {
          return yield* sql`INSERT INTO written_question_coverage (user_id,qualification_path_id,question_id,question_revision_id,round_number) VALUES (${userId},${pathId},${questionId},${revisionId},${round})
 ON CONFLICT (user_id,qualification_path_id,question_id) DO UPDATE SET question_revision_id=EXCLUDED.question_revision_id,round_number=EXCLUDED.round_number,covered_at=clock_timestamp()`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new StudyWriteError({ cause })),
          )
        },
      ),
      storeLearningRound: Effect.fn('StudyRepository.storeLearningRound')(
        function* (userId, pathId, round) {
          return yield* sql`INSERT INTO written_learning_rounds (user_id,qualification_path_id,round_number) VALUES (${userId},${pathId},${round})
 ON CONFLICT (user_id,qualification_path_id) DO UPDATE SET round_number=EXCLUDED.round_number`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new StudyWriteError({ cause })),
          )
        },
      ),
    })
  }),
)
