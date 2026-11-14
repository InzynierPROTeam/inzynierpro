import type { UserId } from '@inzpro/domain/modules/identity/user'
import type {
  WrittenQuestionId,
  QuestionRevisionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type {
  SessionQuestionPosition,
  StudySessionId,
} from '@inzpro/domain/modules/study/study-session'
import { Context, type Effect } from 'effect'
import type {
  NewSessionAnswer,
  NewStudySession,
  StudySession,
} from '~api/modules/study/domain/study-session.model.js'

import type { StudyWriteError } from './errors.js'

export class StudyRepository extends Context.Service<
  StudyRepository,
  {
    readonly transaction: <A, E, R>(
      operation: Effect.Effect<A, E, R>,
    ) => Effect.Effect<A, E | StudyWriteError, R>
    /** Persists a session with its revision references and answer order, returning it as stored. */
    readonly createSession: (
      session: NewStudySession,
    ) => Effect.Effect<StudySession, StudyWriteError>
    /** Keeps the first time the explanation was opened; later openings change nothing. */
    readonly recordAssistance: (
      sessionId: StudySessionId,
      position: SessionQuestionPosition,
    ) => Effect.Effect<void, StudyWriteError>
    /** Stores the session's one answer to the question; a second insert violates its key. */
    readonly recordAnswer: (answer: NewSessionAnswer) => Effect.Effect<void, StudyWriteError>
    /** Appends the answer's LearningEvent with the result, revision, path, mode and assistance. */
    readonly recordLearningEvent: (answer: NewSessionAnswer) => Effect.Effect<void, StudyWriteError>
    readonly moveSession: (
      sessionId: StudySessionId,
      currentPosition: SessionQuestionPosition,
    ) => Effect.Effect<void, StudyWriteError>
    // The answer command owns validation and calls this projection write in its evidence transaction.
    readonly recordCoverage: (
      userId: UserId,
      pathId: QualificationPathId,
      questionId: WrittenQuestionId,
      revisionId: QuestionRevisionId,
    ) => Effect.Effect<void, StudyWriteError>
  }
>()('api/modules/study/StudyRepository') {}
