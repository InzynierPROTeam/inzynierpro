import { ContentAssetId } from '@inzpro/domain/modules/learning-content/content-asset'
import { AnyRichContent } from '@inzpro/rich-content/rich-content'
import { Schema } from 'effect'

export const ContentAssetAddress = Schema.Struct({
  id: ContentAssetId,
  url: Schema.NullOr(Schema.String),
})

export type ContentAssetAddress = typeof ContentAssetAddress.Type

export const ResolvedRichContent = Schema.Struct({
  content: AnyRichContent,
  assets: Schema.Array(ContentAssetAddress),
})

export type ResolvedRichContent = typeof ResolvedRichContent.Type
