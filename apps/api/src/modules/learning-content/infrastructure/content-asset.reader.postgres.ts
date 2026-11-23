import { Effect, Layer, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import { ContentAssetReader } from '~api/modules/learning-content/application/content-asset.reader.js'
import { LearningContentReadError } from '~api/modules/learning-content/application/errors.js'
import { ContentAssetLocation } from '~api/modules/learning-content/domain/learning-content.model.js'

export const ContentAssetReaderLive = Layer.effect(
  ContentAssetReader,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    return ContentAssetReader.of({
      locations: Effect.fn('ContentAssetReader.locations')(
        function* (assetIds) {
          if (assetIds.length === 0) {
            return []
          }

          return yield* sql`SELECT id,storage_key FROM content_assets WHERE id IN ${sql.in(assetIds)}`.pipe(
            Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(ContentAssetLocation))),
          )
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new LearningContentReadError({ cause })),
          SchemaError: cause => Effect.fail(new LearningContentReadError({ cause })),
        }),
      ),
    })
  }),
)
