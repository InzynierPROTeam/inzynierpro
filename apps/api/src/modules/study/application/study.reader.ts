import type { UserId } from '@inzpro/domain/modules/identity/user'
import type {
  QuestionCount,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type {
  SessionQuestionPosition,
  SessionQuestionSelection,
  StudySessionId,
} from '@inzpro/domain/modules/study/study-session'
import { Context, type Effect, type Option } from 'effect'
import type { CursorPage, CursorPageRequest, InvalidCursor } from '~api/lib/cursor-pagination.js'
import type { DocumentQuestionPool } from '~api/modules/study/domain/study-document.model.js'
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
    readonly documents: (
      userId: UserId,
      pathId: QualificationPathId,
      page: CursorPageRequest,
    ) => Effect.Effect<CursorPage<DocumentQuestionPool>, StudyReadError | InvalidCursor>
    /**
     * The document to continue regular study with: the first one in catalogue order, starting from
     * `fromDocumentId` and wrapping around, that still has questions the user has not answered.
     * When every question of the path was answered, the document after the starting one, so study
     * goes through the categories in order again.
     */
    readonly nextDocument: (
      userId: UserId,
      pathId: QualificationPathId,
      fromDocumentId: Option.Option<ReferenceDocumentId>,
    ) => Effect.Effect<Option.Option<DocumentQuestionPool>, StudyReadError>
    readonly document: (
      userId: UserId,
      pathId: QualificationPathId,
      documentId: ReferenceDocumentId,
    ) => Effect.Effect<Option.Option<DocumentQuestionPool>, StudyReadError>
    /** The user's unfinished written study session on a document, if any. */
    readonly unfinishedSession: (
      userId: UserId,
      pathId: QualificationPathId,
      documentId: ReferenceDocumentId,
    ) => Effect.Effect<Option.Option<StudySession>, StudyReadError>
    /** The most recently used session; with a document, only that document's sessions count. */
    readonly latestSession: (
      userId: UserId,
      pathId: QualificationPathId,
      documentId: Option.Option<ReferenceDocumentId>,
    ) => Effect.Effect<Option.Option<StudySession>, StudyReadError>
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
     * order; for unanswered selection only those the user has not answered in regular study.
     */
    readonly sessionCandidates: (
      userId: UserId,
      pathId: QualificationPathId,
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
    /** One cursor page of an owned session's questions with their results, in session order. */
    readonly sessionResults: (
      userId: UserId,
      pathId: QualificationPathId,
      sessionId: StudySessionId,
      page: CursorPageRequest,
    ) => Effect.Effect<CursorPage<SessionQuestionResult>, StudyReadError | InvalidCursor>
  }
>()('api/modules/study/StudyReader') {}
