import type { ContentAssetId } from '@inzpro/domain/modules/learning-content/content-asset'
import { Data } from 'effect'

export class UnknownContentAsset extends Data.TaggedError('UnknownContentAsset')<{
  readonly assetIds: ReadonlyArray<ContentAssetId>
}> {}

export class UnknownReferenceDocument extends Data.TaggedError('UnknownReferenceDocument') {}
