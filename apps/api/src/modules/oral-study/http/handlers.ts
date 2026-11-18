import { Api } from '@inzpro/api-contracts/api'
import { Layer } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { TransactionLive } from '~api/lib/transaction.js'
import { AuthenticationLive } from '~api/middleware/authentication.js'
import { XpReaderLive } from '~api/modules/learning-xp/infrastructure/learning-xp.reader.postgres.js'
import { XpRepositoryLive } from '~api/modules/learning-xp/infrastructure/learning-xp.repository.postgres.js'
import { ReviewSchedulerLive } from '~api/modules/learning/application/review-scheduler.service.js'
import { OralSessionQuizReaderLive } from '~api/modules/oral-study/infrastructure/oral-session-quiz.reader.postgres.js'
import { OralSessionQuizRepositoryLive } from '~api/modules/oral-study/infrastructure/oral-session-quiz.repository.postgres.js'
import { OralStudyReaderLive } from '~api/modules/oral-study/infrastructure/oral-study.reader.postgres.js'
import { OralStudyRepositoryLive } from '~api/modules/oral-study/infrastructure/oral-study.repository.postgres.js'
import { PreparationReaderLive } from '~api/modules/preparation/infrastructure/preparation.reader.postgres.js'
import { PreparationRepositoryLive } from '~api/modules/preparation/infrastructure/preparation.repository.postgres.js'
import { StreakReaderLive } from '~api/modules/streak/infrastructure/streak.reader.postgres.js'
import { StreakRepositoryLive } from '~api/modules/streak/infrastructure/streak.repository.postgres.js'

import { dailyPlanHandlers } from './daily-plan.handlers.js'
import { favoritesHandlers } from './favorites.handlers.js'
import { materialHandlers } from './material.handlers.js'
import { notesHandlers } from './notes.handlers.js'
import { quizHandlers } from './quiz.handlers.js'
import { reviewHandlers } from './review.handlers.js'
import { sessionHandlers } from './session.handlers.js'

export const OralStudyLive = HttpApiBuilder.group(Api, 'OralStudy', handlers =>
  handlers.handleAll({
    ...notesHandlers,
    ...favoritesHandlers,
    ...reviewHandlers,
    ...dailyPlanHandlers,
    ...materialHandlers,
    ...sessionHandlers,
    ...quizHandlers,
  }),
).pipe(Layer.provide(AuthenticationLive))

export const OralStudyRequestServices = Layer.mergeAll(
  TransactionLive,
  PreparationReaderLive,
  PreparationRepositoryLive,
  OralStudyReaderLive,
  OralStudyRepositoryLive,
  OralSessionQuizReaderLive,
  OralSessionQuizRepositoryLive,
  ReviewSchedulerLive,
  StreakReaderLive,
  StreakRepositoryLive,
  XpReaderLive,
  XpRepositoryLive,
)
