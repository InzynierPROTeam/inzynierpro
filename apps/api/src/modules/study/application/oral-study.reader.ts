import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { OralStudySessionId } from '@inzpro/domain/modules/study/oral-study-session'
import type { SessionQuestionPosition } from '@inzpro/domain/modules/study/study-session'
import { Context, type Effect, type Option } from 'effect'
import type { CursorPage, CursorPageRequest, InvalidCursor } from '~api/lib/cursor-pagination.js'
import type {
  LearningRoundNumber,
  LearningRoundProgress,
} from '~api/modules/study/domain/learning-round.model.js'
import type { OralCategoryQuestionPool } from '~api/modules/study/domain/oral-category.model.js'
import type {
  OralSessionCandidate,
  OralSessionQuestion,
  OralSessionQuestionResult,
  OralSessionResultCounts,
  OralStudySession,
} from '~api/modules/study/domain/oral-study-session.model.js'

import type { StudyReadError } from './errors.js'

export class OralStudyReader extends Context.Service<
  OralStudyReader,
  {
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
    ) => Effect.Effect<Option.Option<OralCategoryQuestionPool>, StudyReadError>
    readonly nextCategory: (
      userId: UserId,
      pathId: QualificationPathId,
      continuation: {
        readonly round: LearningRoundNumber
        readonly fromCategoryId: Option.Option<OralQuestionCategoryId>
        readonly skipsStartCategory: boolean
      },
    ) => Effect.Effect<Option.Option<OralCategoryQuestionPool>, StudyReadError>
    readonly sessionCandidates: (
      userId: UserId,
      pathId: QualificationPathId,
      round: LearningRoundNumber,
      categoryId: OralQuestionCategoryId,
      limit: QuestionCount,
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
