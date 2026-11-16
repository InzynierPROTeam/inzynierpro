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
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type {
  SessionQuestionPosition,
  SessionQuestionSelection,
  StudySessionId,
  StudySessionKind,
} from '@inzpro/domain/modules/study/study-session'
import { Context, type Effect, type Option } from 'effect'
import type { CursorPage, CursorPageRequest, InvalidCursor } from '~api/lib/cursor-pagination.js'
import type {
  LearningRoundNumber,
  LearningRoundProgress,
} from '~api/modules/study/domain/learning-round.model.js'
import type { ReviewQueue } from '~api/modules/study/domain/review-session.model.js'
import type { ReviewCard, StudyDay } from '~api/modules/study/domain/review-state.model.js'
import type {
  DocumentQuestionPool,
  SessionDocument,
} from '~api/modules/study/domain/study-document.model.js'
import type {
  SessionCandidate,
  SessionQuestion,
  SessionQuestionResult,
  StudySession,
  StudySessionResultCounts,
} from '~api/modules/study/domain/study-session.model.js'

import type { StudyReadError } from './errors.js'

export class StudyReader extends Context.Service<
  StudyReader,
  {
    /**
     * The learner's stored LearningRound with the path's published, non-withdrawn questions and
     * those covered in that round. A question is covered in a round when a regular-study answer in
     * it covered a revision carrying the question's current substantive content.
     */
    readonly learningRound: (
      userId: UserId,
      pathId: QualificationPathId,
    ) => Effect.Effect<LearningRoundProgress, StudyReadError>
    readonly documents: (
      userId: UserId,
      pathId: QualificationPathId,
      round: LearningRoundNumber,
      page: CursorPageRequest,
    ) => Effect.Effect<CursorPage<DocumentQuestionPool>, StudyReadError | InvalidCursor>
    /**
     * The document to continue regular study with: the first one in catalogue order, starting from
     * `fromDocumentId` and wrapping around, that still has questions uncovered in the round. With
     * `skipsStartDocument` the starting document comes last, so a new round continues with the
     * category after the one that completed the previous round.
     */
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
    /**
     * The user's unfinished written session of the kind and scope, if any: a document, or for a
     * review session without one, the whole path.
     */
    readonly unfinishedSession: (
      userId: UserId,
      pathId: QualificationPathId,
      kind: StudySessionKind,
      documentId: Option.Option<ReferenceDocumentId>,
    ) => Effect.Effect<Option.Option<StudySession>, StudyReadError>
    /**
     * The most recently used regular-study session; with a document, only that document's sessions
     * count. Review sessions resume from their own tiles (ADR-0002).
     */
    readonly latestSession: (
      userId: UserId,
      pathId: QualificationPathId,
      documentId: Option.Option<ReferenceDocumentId>,
    ) => Effect.Effect<Option.Option<StudySession>, StudyReadError>
    /**
     * The most recently used unfinished regular-study session of the path. Each document has at most
     * one, so another document's may be older than the latest session.
     */
    readonly latestUnfinishedSession: (
      userId: UserId,
      pathId: QualificationPathId,
    ) => Effect.Effect<Option.Option<StudySession>, StudyReadError>
    /** The document when it is on the path. */
    readonly pathDocument: (
      pathId: QualificationPathId,
      documentId: ReferenceDocumentId,
    ) => Effect.Effect<Option.Option<SessionDocument>, StudyReadError>
    /**
     * How many questions of the review scope are due at `now` and when the next one becomes due.
     * Due means an SRS due time at or before `now` for a published, non-withdrawn question still
     * on the path, whose state belongs to its current substantive content (ADR-0002). A question
     * whose content was already answered on the study day of `now` waits for the next study day,
     * since a later answer that day would not rate it (ADR-0005).
     */
    readonly reviewQueue: (
      userId: UserId,
      pathId: QualificationPathId,
      documentId: Option.Option<ReferenceDocumentId>,
      now: DateTimeUtc,
    ) => Effect.Effect<ReviewQueue, StudyReadError>
    /** The current revisions of the scope's questions due at `now`, most overdue first. */
    readonly reviewCandidates: (
      userId: UserId,
      pathId: QualificationPathId,
      documentId: Option.Option<ReferenceDocumentId>,
      now: DateTimeUtc,
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
    /**
     * Published, non-withdrawn current revisions of a document's questions on a path, in catalogue
     * order; for uncovered selection only those not covered in the round.
     */
    readonly sessionCandidates: (
      userId: UserId,
      pathId: QualificationPathId,
      round: LearningRoundNumber,
      documentId: ReferenceDocumentId,
      selection: SessionQuestionSelection,
      limit: QuestionCount,
    ) => Effect.Effect<ReadonlyArray<SessionCandidate>, StudyReadError>
    /**
     * The question to continue from: the first unanswered, non-withdrawn one after `position`,
     * wrapping around to the start; none when no question can be answered any more.
     */
    readonly nextOpenPosition: (
      sessionId: StudySessionId,
      position: SessionQuestionPosition,
    ) => Effect.Effect<Option.Option<SessionQuestionPosition>, StudyReadError>
    readonly sessionResultCounts: (
      sessionId: StudySessionId,
    ) => Effect.Effect<StudySessionResultCounts, StudyReadError>
    /**
     * The question's UserReviewState on the path, none for a new card: never answered, or reset
     * because the question's current revision carries other substantive content than the state.
     */
    readonly reviewState: (
      userId: UserId,
      pathId: QualificationPathId,
      questionId: WrittenQuestionId,
    ) => Effect.Effect<Option.Option<ReviewCard>, StudyReadError>
    /**
     * Whether the revision carries the substantive content of its question's current revision,
     * which a cosmetic revision keeps and a substantive one replaces.
     */
    readonly carriesCurrentContent: (
      questionRevisionId: QuestionRevisionId,
    ) => Effect.Effect<boolean, StudyReadError>
    /**
     * Whether a LearningEvent on the path falls on the study day for a revision carrying the same
     * substantive content as the given one, so answers to replaced content do not count.
     */
    readonly answeredContentOnStudyDay: (
      userId: UserId,
      pathId: QualificationPathId,
      questionRevisionId: QuestionRevisionId,
      day: StudyDay,
    ) => Effect.Effect<boolean, StudyReadError>
    /** One cursor page of an owned session's questions with their results, in session order. */
    readonly sessionResults: (
      userId: UserId,
      pathId: QualificationPathId,
      sessionId: StudySessionId,
      page: CursorPageRequest,
    ) => Effect.Effect<CursorPage<SessionQuestionResult>, StudyReadError | InvalidCursor>
  }
>()('api/modules/study/StudyReader') {}
