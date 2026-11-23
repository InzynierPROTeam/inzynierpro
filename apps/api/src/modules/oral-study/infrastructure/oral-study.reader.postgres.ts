import { Effect, Layer } from 'effect'
import { OralStudyReader } from '~api/modules/oral-study/application/oral-study.reader.js'

import { oralDailyPlanReader } from './daily-plan.reader.postgres.js'
import { oralFavoritesReader } from './favorites.reader.postgres.js'
import { oralMaterialReader } from './material.reader.postgres.js'
import { oralReviewReader } from './review.reader.postgres.js'
import { oralSessionReader } from './session.reader.postgres.js'
import { oralStatisticsReader } from './statistics.reader.postgres.js'

export const OralStudyReaderLive = Layer.effect(
  OralStudyReader,
  Effect.gen(function* () {
    const materialReader = yield* oralMaterialReader
    const favoritesReader = yield* oralFavoritesReader
    const sessionReader = yield* oralSessionReader
    const reviewReader = yield* oralReviewReader
    const dailyPlanReader = yield* oralDailyPlanReader
    const statisticsReader = yield* oralStatisticsReader

    return OralStudyReader.of({
      ...materialReader,
      ...favoritesReader,
      ...sessionReader,
      ...reviewReader,
      ...dailyPlanReader,
      ...statisticsReader,
    })
  }),
)
