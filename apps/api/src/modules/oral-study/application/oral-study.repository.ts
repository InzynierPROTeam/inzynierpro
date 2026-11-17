import type { UserId } from '@inzpro/domain/modules/identity/user'
import type {
  OralQuestionId,
  OralRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-question'
import type { QuestionNoteText } from '@inzpro/domain/modules/learning/question-note'
import type { SessionQuestionPosition } from '@inzpro/domain/modules/learning/study-session'
import type {
  OralSelfAssessment,
  OralStudySessionId,
} from '@inzpro/domain/modules/oral-study/oral-study-session'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Context, type Effect } from 'effect'
import type { LearningRoundNumber } from '~api/modules/learning/domain/learning-round.model.js'
import type { QuestionNote } from '~api/modules/learning/domain/question-note.model.js'
import type { LearningEventId } from '~api/modules/learning/domain/review-state.model.js'
import type { QuestionNoteWriteError } from '~api/modules/oral-study/application/errors.js'
import type { StudyWriteError } from '~api/modules/oral-study/application/errors.js'
import type {
  NewOralEvidence,
  NewOralReviewState,
} from '~api/modules/oral-study/domain/oral-review-state.model.js'
import type {
  NewOralStudySession,
  OralStudySession,
  StoredOralSelfAssessment,
} from '~api/modules/oral-study/domain/oral-study-session.model.js'

export class OralStudyRepository extends Context.Service<
  OralStudyRepository,
  {
    readonly transaction: <A, E, R>(
      operation: Effect.Effect<A, E, R>,
    ) => Effect.Effect<A, E | StudyWriteError, R>
    readonly saveNote: (
      userId: UserId,
      questionId: OralQuestionId,
      text: QuestionNoteText,
    ) => Effect.Effect<QuestionNote, QuestionNoteWriteError>
    readonly clearNote: (
      userId: UserId,
      questionId: OralQuestionId,
    ) => Effect.Effect<void, StudyWriteError>
    readonly markFavorite: (
      userId: UserId,
      questionId: OralQuestionId,
    ) => Effect.Effect<void, StudyWriteError>
    readonly unmarkFavorite: (
      userId: UserId,
      questionId: OralQuestionId,
    ) => Effect.Effect<void, StudyWriteError>
    readonly recordLearningEvent: (
      evidence: NewOralEvidence,
    ) => Effect.Effect<LearningEventId, StudyWriteError>
    readonly storeReviewState: (state: NewOralReviewState) => Effect.Effect<void, StudyWriteError>
    readonly createSession: (
      session: NewOralStudySession,
    ) => Effect.Effect<OralStudySession, StudyWriteError>
    readonly recordSelfAssessment: (
      sessionId: OralStudySessionId,
      position: SessionQuestionPosition,
      oralRevisionId: OralRevisionId,
      selfAssessment: OralSelfAssessment,
    ) => Effect.Effect<StoredOralSelfAssessment, StudyWriteError>
    readonly moveSession: (
      sessionId: OralStudySessionId,
      currentPosition: SessionQuestionPosition,
    ) => Effect.Effect<OralStudySession, StudyWriteError>
    readonly endSession: (
      sessionId: OralStudySessionId,
    ) => Effect.Effect<OralStudySession, StudyWriteError>
    readonly recordCoverage: (
      userId: UserId,
      pathId: QualificationPathId,
      questionId: OralQuestionId,
      revisionId: OralRevisionId,
      round: LearningRoundNumber,
    ) => Effect.Effect<void, StudyWriteError>
    readonly storeLearningRound: (
      userId: UserId,
      pathId: QualificationPathId,
      round: LearningRoundNumber,
    ) => Effect.Effect<void, StudyWriteError>
  }
>()('api/modules/study/OralStudyRepository') {}
