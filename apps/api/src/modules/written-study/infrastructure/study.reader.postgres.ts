import { Effect, Layer } from 'effect'
import { StudyReader } from '~api/modules/written-study/application/study.reader.js'

import { writtenDailyPlanReader } from './daily-plan.reader.postgres.js'
import { writtenFavoritesReader } from './favorites.reader.postgres.js'
import { writtenMaterialReader } from './material.reader.postgres.js'
import { writtenReviewReader } from './review.reader.postgres.js'
import { writtenSessionReader } from './session.reader.postgres.js'
import { writtenStatisticsReader } from './statistics.reader.postgres.js'

export const StudyReaderLive = Layer.effect(
  StudyReader,
  Effect.gen(function* () {
    const materialReader = yield* writtenMaterialReader
    const sessionReader = yield* writtenSessionReader
    const reviewReader = yield* writtenReviewReader
    const favoritesReader = yield* writtenFavoritesReader
    const dailyPlanReader = yield* writtenDailyPlanReader
    const statisticsReader = yield* writtenStatisticsReader

    return StudyReader.of({
      ...materialReader,
      ...sessionReader,
      ...reviewReader,
      ...favoritesReader,
      ...dailyPlanReader,
      ...statisticsReader,
    })
  }),
)
