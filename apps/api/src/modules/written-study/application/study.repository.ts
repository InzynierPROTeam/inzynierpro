import type { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type {
  WrittenQuestionId,
  QuestionRevisionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import type { QuestionNoteText } from '@inzpro/domain/modules/learning/question-note'
import type {
  SessionQuestionPosition,
  StudySessionId,
} from '@inzpro/domain/modules/learning/study-session'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Context, type Effect } from 'effect'
import type { LearningRoundNumber } from '~api/modules/learning/domain/learning-round.model.js'
import type { QuestionNote } from '~api/modules/learning/domain/question-note.model.js'
import type { LearningEventId } from '~api/modules/learning/domain/review-state.model.js'
import type {
  QuestionNoteWriteError,
  StudyWriteError,
} from '~api/modules/written-study/application/errors.js'
import type {
  LearningEventContext,
  NewReviewState,
  NewWrittenEvidence,
} from '~api/modules/written-study/domain/review-state.model.js'
import type {
  NewSessionAnswer,
  NewStudySession,
  SessionAnswer,
  StudySession,
} from '~api/modules/written-study/domain/study-session.model.js'

export class StudyRepository extends Context.Service<
  StudyRepository,
  {
    readonly createSession: (
      session: NewStudySession,
    ) => Effect.Effect<StudySession, StudyWriteError>
    readonly recordExplanationOpening: (
      sessionId: StudySessionId,
      position: SessionQuestionPosition,
    ) => Effect.Effect<DateTimeUtc, StudyWriteError>
    readonly recordNoteOpening: (
      sessionId: StudySessionId,
      position: SessionQuestionPosition,
    ) => Effect.Effect<DateTimeUtc, StudyWriteError>
    readonly recordAnswer: (
      answer: NewSessionAnswer,
    ) => Effect.Effect<SessionAnswer, StudyWriteError>
    readonly recordLearningEvent: (
      evidence: NewWrittenEvidence,
      context: LearningEventContext,
    ) => Effect.Effect<LearningEventId, StudyWriteError>
    readonly storeReviewState: (state: NewReviewState) => Effect.Effect<void, StudyWriteError>
    readonly markFavorite: (
      userId: UserId,
      questionId: WrittenQuestionId,
    ) => Effect.Effect<void, StudyWriteError>
    readonly unmarkFavorite: (
      userId: UserId,
      questionId: WrittenQuestionId,
    ) => Effect.Effect<void, StudyWriteError>
    readonly saveNote: (
      userId: UserId,
      questionId: WrittenQuestionId,
      text: QuestionNoteText,
    ) => Effect.Effect<QuestionNote, QuestionNoteWriteError>
    readonly clearNote: (
      userId: UserId,
      questionId: WrittenQuestionId,
    ) => Effect.Effect<void, StudyWriteError>
    readonly moveSession: (
      sessionId: StudySessionId,
      currentPosition: SessionQuestionPosition,
    ) => Effect.Effect<StudySession, StudyWriteError>
    readonly endSession: (sessionId: StudySessionId) => Effect.Effect<StudySession, StudyWriteError>
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
