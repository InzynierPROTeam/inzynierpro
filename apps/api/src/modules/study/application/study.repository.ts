import type { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type {
  WrittenQuestionId,
  QuestionRevisionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { QuestionNoteText } from '@inzpro/domain/modules/study/question-note'
import type {
  SessionQuestionPosition,
  StudySessionId,
} from '@inzpro/domain/modules/study/study-session'
import { Context, type Effect } from 'effect'
import type { LearningRoundNumber } from '~api/modules/study/domain/learning-round.model.js'
import type { QuestionNote } from '~api/modules/study/domain/question-note.model.js'
import type {
  LearningEventContext,
  LearningEventId,
  NewReviewState,
} from '~api/modules/study/domain/review-state.model.js'
import type {
  NewSessionAnswer,
  NewStudySession,
  SessionAnswer,
  StudySession,
} from '~api/modules/study/domain/study-session.model.js'

import type { QuestionNoteWriteError, StudyWriteError } from './errors.js'

export class StudyRepository extends Context.Service<
  StudyRepository,
  {
    readonly transaction: <A, E, R>(
      operation: Effect.Effect<A, E, R>,
    ) => Effect.Effect<A, E | StudyWriteError, R>
    readonly createSession: (
      session: NewStudySession,
    ) => Effect.Effect<StudySession, StudyWriteError>
    /**
     * Records when the explanation was first opened and returns it. The caller checks under the
     * account lock that it was not recorded yet.
     */
    readonly recordExplanationOpening: (
      sessionId: StudySessionId,
      position: SessionQuestionPosition,
    ) => Effect.Effect<DateTimeUtc, StudyWriteError>
    /**
     * Records when a saved note was first opened and returns it. The caller checks under the
     * account lock that it was not recorded yet and that the note is saved.
     */
    readonly recordNoteOpening: (
      sessionId: StudySessionId,
      position: SessionQuestionPosition,
    ) => Effect.Effect<DateTimeUtc, StudyWriteError>
    /** Stores the session's one answer to the question and returns it; a second insert violates its key. */
    readonly recordAnswer: (
      answer: NewSessionAnswer,
    ) => Effect.Effect<SessionAnswer, StudyWriteError>
    readonly recordLearningEvent: (
      answer: NewSessionAnswer,
      context: LearningEventContext,
    ) => Effect.Effect<LearningEventId, StudyWriteError>
    readonly storeReviewState: (state: NewReviewState) => Effect.Effect<void, StudyWriteError>
    /** Marks the question as the learner's FavoriteQuestion on every path; an existing mark stays. */
    readonly markFavorite: (
      userId: UserId,
      questionId: WrittenQuestionId,
    ) => Effect.Effect<void, StudyWriteError>
    readonly unmarkFavorite: (
      userId: UserId,
      questionId: WrittenQuestionId,
    ) => Effect.Effect<void, StudyWriteError>
    /**
     * Replaces the learner's PersonalQuestionNote with the text and the question's current revision,
     * and returns it as stored.
     */
    readonly saveNote: (
      userId: UserId,
      questionId: WrittenQuestionId,
      text: QuestionNoteText,
    ) => Effect.Effect<QuestionNote, QuestionNoteWriteError>
    readonly clearNote: (
      userId: UserId,
      questionId: WrittenQuestionId,
    ) => Effect.Effect<void, StudyWriteError>
    /** Moves the continue point after an answer, which also makes the session the most recently used; returns the session. */
    readonly moveSession: (
      sessionId: StudySessionId,
      currentPosition: SessionQuestionPosition,
    ) => Effect.Effect<StudySession, StudyWriteError>
    /**
     * Ends an unfinished session and returns it as stored; its answers and LearningEvents stay.
     * The caller checks under the account lock that it is still unfinished.
     */
    readonly endSession: (sessionId: StudySessionId) => Effect.Effect<StudySession, StudyWriteError>
    // The answer command owns validation and calls these projection writes in its evidence transaction.
    readonly recordCoverage: (
      userId: UserId,
      pathId: QualificationPathId,
      questionId: WrittenQuestionId,
      revisionId: QuestionRevisionId,
      round: LearningRoundNumber,
    ) => Effect.Effect<void, StudyWriteError>
    readonly storeLearningRound: (
      userId: UserId,
      pathId: QualificationPathId,
      round: LearningRoundNumber,
    ) => Effect.Effect<void, StudyWriteError>
  }
>()('api/modules/study/StudyRepository') {}
