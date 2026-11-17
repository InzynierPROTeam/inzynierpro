import { Effect, Layer } from 'effect'
import { StudyReader } from '~api/modules/written-study/application/study.reader.js'

import { writtenFavoritesReader } from './favorites.reader.postgres.js'
import { writtenMaterialReader } from './material.reader.postgres.js'
import { writtenReviewReader } from './review.reader.postgres.js'
import { writtenSessionReader } from './session.reader.postgres.js'

export const StudyReaderLive = Layer.effect(
  StudyReader,
  Effect.gen(function* () {
    const materialReader = yield* writtenMaterialReader
    const sessionReader = yield* writtenSessionReader
    const reviewReader = yield* writtenReviewReader
    const favoritesReader = yield* writtenFavoritesReader

    return StudyReader.of({
      ...materialReader,
      ...sessionReader,
      ...reviewReader,
      ...favoritesReader,
    })
  }),
)
