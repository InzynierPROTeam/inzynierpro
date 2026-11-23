import { Api } from '@inzpro/api-contracts/api'
import { Layer } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { TransactionLive } from '~api/lib/transaction.js'
import { XpReaderLive } from '~api/modules/learning-xp/infrastructure/learning-xp.reader.postgres.js'
import { XpRepositoryLive } from '~api/modules/learning-xp/infrastructure/learning-xp.repository.postgres.js'
import { ReviewSchedulerLive } from '~api/modules/learning/application/review-scheduler.service.js'
import { PreparationReaderLive } from '~api/modules/preparation/infrastructure/preparation.reader.postgres.js'
import { PreparationRepositoryLive } from '~api/modules/preparation/infrastructure/preparation.repository.postgres.js'
import { StreakReaderLive } from '~api/modules/streak/infrastructure/streak.reader.postgres.js'
import { StreakRepositoryLive } from '~api/modules/streak/infrastructure/streak.repository.postgres.js'
import { StudyReaderLive } from '~api/modules/written-study/infrastructure/study.reader.postgres.js'
import { StudyRepositoryLive } from '~api/modules/written-study/infrastructure/study.repository.postgres.js'

import { dailyPlanHandlers } from './daily-plan.handlers.js'
import { favoritesHandlers } from './favorites.handlers.js'
import { materialHandlers } from './material.handlers.js'
import { notesHandlers } from './notes.handlers.js'
import { reviewHandlers } from './review.handlers.js'
import { sessionHandlers } from './session.handlers.js'

export const StudyLive = HttpApiBuilder.group(Api, 'Study', handlers =>
  handlers.handleAll({
    ...materialHandlers,
    ...sessionHandlers,
    ...reviewHandlers,
    ...dailyPlanHandlers,
    ...favoritesHandlers,
    ...notesHandlers,
  }),
)

export const StudyRequestServices = Layer.mergeAll(
  TransactionLive,
  PreparationReaderLive,
  PreparationRepositoryLive,
  StudyReaderLive,
  StudyRepositoryLive,
  ReviewSchedulerLive,
  StreakReaderLive,
  StreakRepositoryLive,
  XpReaderLive,
  XpRepositoryLive,
)
