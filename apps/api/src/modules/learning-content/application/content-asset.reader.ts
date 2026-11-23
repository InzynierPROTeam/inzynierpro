import type { ContentAssetId } from '@inzpro/domain/modules/learning-content/content-asset'
import { Context, type Effect } from 'effect'
import type { ContentAssetLocation } from '~api/modules/learning-content/domain/learning-content.model.js'

import type { LearningContentReadError } from './errors.js'

export class ContentAssetReader extends Context.Service<
  ContentAssetReader,
  {
    readonly locations: (
      assetIds: ReadonlyArray<ContentAssetId>,
    ) => Effect.Effect<ReadonlyArray<ContentAssetLocation>, LearningContentReadError>
  }
>()('api/modules/learning-content/ContentAssetReader') {}
