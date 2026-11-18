import type { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type { DailyPlanSettingsVersion } from '@inzpro/domain/modules/daily-plan/daily-plan'
import type { DistrictChamberId } from '@inzpro/domain/modules/exam-calendar/district-chamber'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type {
  OralQuestionId,
  OralRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-question'
import type { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import type { SessionQuestionPosition } from '@inzpro/domain/modules/learning/study-session'
import type { OralStudySessionId } from '@inzpro/domain/modules/oral-study/oral-study-session'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Context, type DateTime, type Effect, type Option } from 'effect'
import type { CursorPage, CursorPageRequest, InvalidCursor } from '~api/lib/cursor-pagination.js'
import type {
  DailyPlanRecord,
  DailyPlanSettings,
} from '~api/modules/daily-plan/domain/daily-plan.model.js'
import type {
  LearningRoundNumber,
  LearningRoundProgress,
} from '~api/modules/learning/domain/learning-round.model.js'
import type { ReviewQueue } from '~api/modules/learning/domain/review-queue.model.js'
import type { ReviewCard, StudyDay } from '~api/modules/learning/domain/review-state.model.js'
import type { StudyReadError } from '~api/modules/oral-study/application/errors.js'
import type { OralCategoryQuestionPool } from '~api/modules/oral-study/domain/oral-category.model.js'
import type {
  OralSessionCandidate,
  OralSessionQuestion,
  OralSessionQuestionResult,
  OralSessionResultCounts,
  OralStudySession,
} from '~api/modules/oral-study/domain/oral-study-session.model.js'

export class OralStudyReader extends Context.Service<
  OralStudyReader,
  {
    readonly isPathQuestion: (
      pathId: QualificationPathId,
      questionId: OralQuestionId,
    ) => Effect.Effect<boolean, StudyReadError>
    readonly favoriteQuestionCount: (
      userId: UserId,
      pathId: QualificationPathId,
    ) => Effect.Effect<QuestionCount, StudyReadError>
    readonly favoriteCandidates: (
      userId: UserId,
      pathId: QualificationPathId,
      limit: QuestionCount,
    ) => Effect.Effect<ReadonlyArray<OralSessionCandidate>, StudyReadError>
    readonly unfinishedFavoritesSession: (
      userId: UserId,
      pathId: QualificationPathId,
    ) => Effect.Effect<Option.Option<OralStudySession>, StudyReadError>
    readonly reviewQueue: (
      userId: UserId,
      pathId: QualificationPathId,
      categoryId: Option.Option<OralQuestionCategoryId>,
      now: DateTimeUtc,
      reportedIn: Option.Option<DistrictChamberId>,
    ) => Effect.Effect<ReviewQueue, StudyReadError>
    readonly reviewCandidates: (
      userId: UserId,
      pathId: QualificationPathId,
      categoryId: Option.Option<OralQuestionCategoryId>,
      now: DateTimeUtc,
      limit: QuestionCount,
      reportedIn: Option.Option<DistrictChamberId>,
    ) => Effect.Effect<ReadonlyArray<OralSessionCandidate>, StudyReadError>
    readonly unfinishedReviewSession: (
      userId: UserId,
      pathId: QualificationPathId,
      categoryId: Option.Option<OralQuestionCategoryId>,
    ) => Effect.Effect<Option.Option<OralStudySession>, StudyReadError>
    readonly reviewState: (
      userId: UserId,
      pathId: QualificationPathId,
      questionId: OralQuestionId,
    ) => Effect.Effect<Option.Option<ReviewCard>, StudyReadError>
    readonly carriesCurrentContent: (
      oralRevisionId: OralRevisionId,
    ) => Effect.Effect<boolean, StudyReadError>
    readonly answeredContentOnStudyDay: (
      userId: UserId,
      pathId: QualificationPathId,
      oralRevisionId: OralRevisionId,
      day: StudyDay,
    ) => Effect.Effect<boolean, StudyReadError>
    readonly dailyPlan: (
      userId: UserId,
      pathId: QualificationPathId,
      studyDay: DateTime.Utc,
    ) => Effect.Effect<Option.Option<DailyPlanRecord>, StudyReadError>
    readonly firstDailyPlanOfPace: (
      userId: UserId,
      pathId: QualificationPathId,
      round: LearningRoundNumber,
      settingsVersion: DailyPlanSettingsVersion,
    ) => Effect.Effect<Option.Option<DailyPlanRecord>, StudyReadError>
    readonly dailyPlanSettings: (
      userId: UserId,
      pathId: QualificationPathId,
    ) => Effect.Effect<DailyPlanSettings, StudyReadError>
    readonly learningRound: (
      userId: UserId,
      pathId: QualificationPathId,
    ) => Effect.Effect<LearningRoundProgress, StudyReadError>
    readonly categories: (
      userId: UserId,
      pathId: QualificationPathId,
      round: LearningRoundNumber,
      page: CursorPageRequest,
    ) => Effect.Effect<CursorPage<OralCategoryQuestionPool>, StudyReadError | InvalidCursor>
    readonly category: (
      userId: UserId,
      pathId: QualificationPathId,
      round: LearningRoundNumber,
      categoryId: OralQuestionCategoryId,
      reportedIn: Option.Option<DistrictChamberId>,
    ) => Effect.Effect<Option.Option<OralCategoryQuestionPool>, StudyReadError>
    readonly nextCategory: (
      userId: UserId,
      pathId: QualificationPathId,
      continuation: {
        readonly round: LearningRoundNumber
        readonly fromCategoryId: Option.Option<OralQuestionCategoryId>
        readonly skipsStartCategory: boolean
      },
      reportedIn: Option.Option<DistrictChamberId>,
    ) => Effect.Effect<Option.Option<OralCategoryQuestionPool>, StudyReadError>
    readonly sessionCandidates: (
      userId: UserId,
      pathId: QualificationPathId,
      round: LearningRoundNumber,
      categoryId: OralQuestionCategoryId,
      limit: QuestionCount,
      reportedIn: Option.Option<DistrictChamberId>,
    ) => Effect.Effect<ReadonlyArray<OralSessionCandidate>, StudyReadError>
    readonly unfinishedSession: (
      userId: UserId,
      pathId: QualificationPathId,
      categoryId: OralQuestionCategoryId,
    ) => Effect.Effect<Option.Option<OralStudySession>, StudyReadError>
    readonly latestSession: (
      userId: UserId,
      pathId: QualificationPathId,
      categoryId: Option.Option<OralQuestionCategoryId>,
    ) => Effect.Effect<Option.Option<OralStudySession>, StudyReadError>
    readonly latestUnfinishedSession: (
      userId: UserId,
      pathId: QualificationPathId,
    ) => Effect.Effect<Option.Option<OralStudySession>, StudyReadError>
    readonly session: (
      userId: UserId,
      pathId: QualificationPathId,
      sessionId: OralStudySessionId,
    ) => Effect.Effect<Option.Option<OralStudySession>, StudyReadError>
    readonly sessionQuestion: (
      userId: UserId,
      pathId: QualificationPathId,
      sessionId: OralStudySessionId,
      position: SessionQuestionPosition,
    ) => Effect.Effect<Option.Option<OralSessionQuestion>, StudyReadError>
    readonly nextOpenPosition: (
      sessionId: OralStudySessionId,
      position: SessionQuestionPosition,
    ) => Effect.Effect<Option.Option<SessionQuestionPosition>, StudyReadError>
    readonly sessionResultCounts: (
      sessionId: OralStudySessionId,
    ) => Effect.Effect<OralSessionResultCounts, StudyReadError>
    readonly sessionResults: (
      userId: UserId,
      pathId: QualificationPathId,
      sessionId: OralStudySessionId,
      page: CursorPageRequest,
    ) => Effect.Effect<CursorPage<OralSessionQuestionResult>, StudyReadError | InvalidCursor>
  }
>()('api/modules/study/OralStudyReader') {}
