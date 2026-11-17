import { Effect, Schema } from 'effect'
import { LearningContentRepository } from '~api/modules/learning-content/application/learning-content.repository.js'
import { ContentAsset } from '~api/modules/learning-content/domain/learning-content.model.js'
import { runFixture } from '~api/test/run-fixture.js'

export const addFixtureAsset = () =>
  runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository

      const asset = yield* Schema.decodeEffect(ContentAsset)({
        id: crypto.randomUUID(),
        storageKey: `test/${crypto.randomUUID()}.png`,
        mediaType: 'image/png',
        width: 640,
        height: 480,
        size: 2048,
      })

      yield* learningContentRepository.createAsset(asset)

      return asset.id
    }),
  )
