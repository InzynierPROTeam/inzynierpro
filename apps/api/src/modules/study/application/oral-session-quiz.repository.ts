import type { OralSessionQuizId } from '@inzpro/domain/modules/study/oral-session-quiz'
import type { OralQuizCheckPosition } from '@inzpro/domain/modules/study/oral-session-quiz'
import { Context, type Effect } from 'effect'
import type {
  NewOralSessionQuiz,
  OralQuizAnswer,
} from '~api/modules/study/domain/oral-session-quiz.model.js'

import type { StudyWriteError } from './errors.js'

export class OralSessionQuizRepository extends Context.Service<
  OralSessionQuizRepository,
  {
    readonly createQuiz: (quiz: NewOralSessionQuiz) => Effect.Effect<void, StudyWriteError>
    readonly recordAnswer: (
      quizId: OralSessionQuizId,
      position: OralQuizCheckPosition,
      answer: OralQuizAnswer,
    ) => Effect.Effect<void, StudyWriteError>
  }
>()('api/modules/study/OralSessionQuizRepository') {}
