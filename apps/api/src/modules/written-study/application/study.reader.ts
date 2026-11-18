import type { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type {
  QuestionCount,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import type {
  QuestionRevisionId,
  WrittenQuestionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import type {
  SessionQuestionPosition,
  SessionQuestionSelection,
  StudySessionId,
  StudySessionKind,
} from '@inzpro/domain/modules/learning/study-session'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Context, type DateTime, type Effect, type Option } from 'effect'
import type { CursorPage, CursorPageRequest, InvalidCursor } from '~api/lib/cursor-pagination.js'
import type { DailyPlanRecord } from '~api/modules/daily-plan/domain/daily-plan.model.js'
import type {
  LearningRoundNumber,
  LearningRoundProgress,
} from '~api/modules/learning/domain/learning-round.model.js'
import type { ReviewQueue } from '~api/modules/learning/domain/review-queue.model.js'
import type { ReviewCard, StudyDay } from '~api/modules/learning/domain/review-state.model.js'
import type { StudyReadError } from '~api/modules/written-study/application/errors.js'
import type {
  DocumentQuestionPool,
  SessionDocument,
} from '~api/modules/written-study/domain/study-document.model.js'
import type {
  SessionCandidate,
  SessionQuestion,
  SessionQuestionResult,
  StudySession,
  StudySessionResultCounts,
} from '~api/modules/written-study/domain/study-session.model.js'

export class StudyReader extends Context.Service<
  StudyReader,
  {
    readonly learningRound: (
      userId: UserId,
      pathId: QualificationPathId,
    ) => Effect.Effect<LearningRoundProgress, StudyReadError>
    readonly dailyPlan: (
      userId: UserId,
      pathId: QualificationPathId,
      studyDay: DateTime.Utc,
    ) => Effect.Effect<Option.Option<DailyPlanRecord>, StudyReadError>
    readonly firstDailyPlanOfRound: (
      userId: UserId,
      pathId: QualificationPathId,
      round: LearningRoundNumber,
    ) => Effect.Effect<Option.Option<DailyPlanRecord>, StudyReadError>
    readonly documents: (
      userId: UserId,
      pathId: QualificationPathId,
      round: LearningRoundNumber,
      page: CursorPageRequest,
    ) => Effect.Effect<CursorPage<DocumentQuestionPool>, StudyReadError | InvalidCursor>
    readonly nextDocument: (
      userId: UserId,
      pathId: QualificationPathId,
      continuation: {
        readonly round: LearningRoundNumber
        readonly fromDocumentId: Option.Option<ReferenceDocumentId>
        readonly skipsStartDocument: boolean
      },
    ) => Effect.Effect<Option.Option<DocumentQuestionPool>, StudyReadError>
    readonly document: (
      userId: UserId,
      pathId: QualificationPathId,
      round: LearningRoundNumber,
      documentId: ReferenceDocumentId,
    ) => Effect.Effect<Option.Option<DocumentQuestionPool>, StudyReadError>
    readonly unfinishedSession: (
      userId: UserId,
      pathId: QualificationPathId,
      kind: StudySessionKind,
      documentId: Option.Option<ReferenceDocumentId>,
    ) => Effect.Effect<Option.Option<StudySession>, StudyReadError>
    readonly latestSession: (
      userId: UserId,
      pathId: QualificationPathId,
      documentId: Option.Option<ReferenceDocumentId>,
    ) => Effect.Effect<Option.Option<StudySession>, StudyReadError>
    readonly latestUnfinishedSession: (
      userId: UserId,
      pathId: QualificationPathId,
    ) => Effect.Effect<Option.Option<StudySession>, StudyReadError>
    readonly pathDocument: (
      pathId: QualificationPathId,
      documentId: ReferenceDocumentId,
    ) => Effect.Effect<Option.Option<SessionDocument>, StudyReadError>
    readonly reviewQueue: (
      userId: UserId,
      pathId: QualificationPathId,
      documentId: Option.Option<ReferenceDocumentId>,
      now: DateTimeUtc,
    ) => Effect.Effect<ReviewQueue, StudyReadError>
    readonly reviewCandidates: (
      userId: UserId,
      pathId: QualificationPathId,
      documentId: Option.Option<ReferenceDocumentId>,
      now: DateTimeUtc,
      limit: QuestionCount,
    ) => Effect.Effect<ReadonlyArray<SessionCandidate>, StudyReadError>
    readonly isPathQuestion: (
      pathId: QualificationPathId,
      questionId: WrittenQuestionId,
    ) => Effect.Effect<boolean, StudyReadError>
    readonly favoriteQuestionCount: (
      userId: UserId,
      pathId: QualificationPathId,
      documentId: Option.Option<ReferenceDocumentId>,
    ) => Effect.Effect<QuestionCount, StudyReadError>
    readonly favoriteCandidates: (
      userId: UserId,
      pathId: QualificationPathId,
      documentId: Option.Option<ReferenceDocumentId>,
      limit: QuestionCount,
    ) => Effect.Effect<ReadonlyArray<SessionCandidate>, StudyReadError>
    readonly session: (
      userId: UserId,
      pathId: QualificationPathId,
      sessionId: StudySessionId,
    ) => Effect.Effect<Option.Option<StudySession>, StudyReadError>
    readonly sessionQuestion: (
      userId: UserId,
      pathId: QualificationPathId,
      sessionId: StudySessionId,
      position: SessionQuestionPosition,
    ) => Effect.Effect<Option.Option<SessionQuestion>, StudyReadError>
    readonly sessionCandidates: (
      userId: UserId,
      pathId: QualificationPathId,
      round: LearningRoundNumber,
      documentId: ReferenceDocumentId,
      selection: SessionQuestionSelection,
      limit: QuestionCount,
    ) => Effect.Effect<ReadonlyArray<SessionCandidate>, StudyReadError>
    readonly nextOpenPosition: (
      sessionId: StudySessionId,
      position: SessionQuestionPosition,
    ) => Effect.Effect<Option.Option<SessionQuestionPosition>, StudyReadError>
    readonly sessionResultCounts: (
      sessionId: StudySessionId,
    ) => Effect.Effect<StudySessionResultCounts, StudyReadError>
    readonly reviewState: (
      userId: UserId,
      pathId: QualificationPathId,
      questionId: WrittenQuestionId,
    ) => Effect.Effect<Option.Option<ReviewCard>, StudyReadError>
    readonly carriesCurrentContent: (
      questionRevisionId: QuestionRevisionId,
    ) => Effect.Effect<boolean, StudyReadError>
    readonly answeredContentOnStudyDay: (
      userId: UserId,
      pathId: QualificationPathId,
      questionRevisionId: QuestionRevisionId,
      day: StudyDay,
    ) => Effect.Effect<boolean, StudyReadError>
    readonly sessionResults: (
      userId: UserId,
      pathId: QualificationPathId,
      sessionId: StudySessionId,
      page: CursorPageRequest,
    ) => Effect.Effect<CursorPage<SessionQuestionResult>, StudyReadError | InvalidCursor>
  }
>()('api/modules/study/StudyReader') {}
