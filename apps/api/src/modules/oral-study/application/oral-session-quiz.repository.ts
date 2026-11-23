import type { OralSessionQuizId } from '@inzpro/domain/modules/oral-study/oral-session-quiz'
import type { OralQuizCheckPosition } from '@inzpro/domain/modules/oral-study/oral-session-quiz'
import { Context, type Effect } from 'effect'
import type { StudyWriteError } from '~api/modules/oral-study/application/errors.js'
import type {
  NewOralSessionQuiz,
  OralQuizAnswer,
} from '~api/modules/oral-study/domain/oral-session-quiz.model.js'
import type { KnowledgeCheckStatisticAnswer } from '~api/modules/oral-study/domain/oral-statistics.model.js'

export class OralSessionQuizRepository extends Context.Service<
  OralSessionQuizRepository,
  {
    readonly createQuiz: (quiz: NewOralSessionQuiz) => Effect.Effect<void, StudyWriteError>
    readonly recordAnswer: (
      quizId: OralSessionQuizId,
      position: OralQuizCheckPosition,
      answer: OralQuizAnswer,
    ) => Effect.Effect<void, StudyWriteError>
    readonly recordCheckStatistic: (
      statistic: KnowledgeCheckStatisticAnswer,
    ) => Effect.Effect<void, StudyWriteError>
  }
>()('api/modules/study/OralSessionQuizRepository') {}
