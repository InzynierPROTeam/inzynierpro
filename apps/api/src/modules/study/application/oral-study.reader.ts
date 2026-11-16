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
    /**
     * The learner's stored oral LearningRound with the path's published, non-withdrawn oral
     * questions and those covered in that round. A question is covered in a round when a
     * self-assessment in it covered a revision carrying the question's current substantive content.
     */
    readonly learningRound: (
      userId: UserId,
      pathId: QualificationPathId,
    ) => Effect.Effect<LearningRoundProgress, StudyReadError>
    /**
     * Oral categories in catalogue order that have published, non-withdrawn questions assigned to
     * the path; a category is never assigned to a path as a whole (ADR-0008).
     */
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
    /**
     * The category to continue oral study with: the first one in catalogue order, starting from
     * `fromCategoryId` and wrapping around, that still has questions uncovered in the round. With
     * `skipsStartCategory` the starting category comes last, so a new round continues with the
     * category after the one that completed the previous round.
     */
    readonly nextCategory: (
      userId: UserId,
      pathId: QualificationPathId,
      continuation: {
        readonly round: LearningRoundNumber
        readonly fromCategoryId: Option.Option<OralQuestionCategoryId>
        readonly skipsStartCategory: boolean
      },
    ) => Effect.Effect<Option.Option<OralCategoryQuestionPool>, StudyReadError>
    /**
     * Published, non-withdrawn current revisions of a category's questions on the path: those
     * uncovered in the round first, each group in catalogue order.
     */
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
    /** The most recently used oral session; with a category, only that category's sessions count. */
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
    /**
     * The question to continue from: the first one without a self-assessment and not withdrawn
     * after `position`, wrapping around to the start; none when nothing can be assessed any more.
     */
    readonly nextOpenPosition: (
      sessionId: OralStudySessionId,
      position: SessionQuestionPosition,
    ) => Effect.Effect<Option.Option<SessionQuestionPosition>, StudyReadError>
    readonly sessionResultCounts: (
      sessionId: OralStudySessionId,
    ) => Effect.Effect<OralSessionResultCounts, StudyReadError>
    /** One cursor page of an owned session's questions with their self-assessments, in session order. */
    readonly sessionResults: (
      userId: UserId,
      pathId: QualificationPathId,
      sessionId: OralStudySessionId,
      page: CursorPageRequest,
    ) => Effect.Effect<CursorPage<OralSessionQuestionResult>, StudyReadError | InvalidCursor>
  }
>()('api/modules/study/OralStudyReader') {}
