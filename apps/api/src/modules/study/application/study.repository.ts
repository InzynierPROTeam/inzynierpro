import type { UserId } from '@inzpro/domain/modules/identity/user'
import type {
  WrittenQuestionId,
  QuestionRevisionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Context, type Effect } from 'effect'
import type {
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
    // The answer command owns validation and calls this projection write in its evidence transaction.
    readonly recordCoverage: (
      userId: UserId,
      pathId: QualificationPathId,
      questionId: WrittenQuestionId,
      revisionId: QuestionRevisionId,
    ) => Effect.Effect<void, StudyWriteError>
  }
>()('api/modules/study/StudyRepository') {}
