import type { UserId } from '@inzpro/domain/modules/identity/user'
import type {
  KnowledgeCheckFormat,
  OralKnowledgeCheckRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-knowledge-check'
import type { OralQuizCheckPosition } from '@inzpro/domain/modules/oral-study/oral-session-quiz'
import type { OralStudySessionId } from '@inzpro/domain/modules/oral-study/oral-study-session'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Context, type Effect, type Option } from 'effect'
import type { CursorPage, CursorPageRequest, InvalidCursor } from '~api/lib/cursor-pagination.js'
import type { StudyReadError } from '~api/modules/oral-study/application/errors.js'
import type {
  KnowledgeCheckCandidate,
  OralQuizCheck,
  OralSessionQuiz,
} from '~api/modules/oral-study/domain/oral-session-quiz.model.js'
import type { KnowledgeCheckStatistics } from '~api/modules/oral-study/domain/oral-statistics.model.js'

export class OralSessionQuizReader extends Context.Service<
  OralSessionQuizReader,
  {
    readonly availableFormats: (
      sessionId: OralStudySessionId,
    ) => Effect.Effect<ReadonlyArray<KnowledgeCheckFormat>, StudyReadError>
    readonly candidates: (
      sessionId: OralStudySessionId,
      formats: ReadonlyArray<KnowledgeCheckFormat>,
    ) => Effect.Effect<ReadonlyArray<KnowledgeCheckCandidate>, StudyReadError>
    readonly quiz: (
      userId: UserId,
      pathId: QualificationPathId,
      sessionId: OralStudySessionId,
    ) => Effect.Effect<Option.Option<OralSessionQuiz>, StudyReadError>
    readonly checks: (
      userId: UserId,
      pathId: QualificationPathId,
      sessionId: OralStudySessionId,
      page: CursorPageRequest,
    ) => Effect.Effect<CursorPage<OralQuizCheck>, StudyReadError | InvalidCursor>
    readonly check: (
      userId: UserId,
      pathId: QualificationPathId,
      sessionId: OralStudySessionId,
      position: OralQuizCheckPosition,
    ) => Effect.Effect<Option.Option<OralQuizCheck>, StudyReadError>
    readonly checkStatistics: (
      knowledgeCheckRevisionId: OralKnowledgeCheckRevisionId,
    ) => Effect.Effect<ReadonlyArray<KnowledgeCheckStatistics>, StudyReadError>
  }
>()('api/modules/study/OralSessionQuizReader') {}
