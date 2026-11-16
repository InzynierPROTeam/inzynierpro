import type { ResolvedRichContent } from '@inzpro/api-contracts/modules/learning-content/responses'
import { imageAssetIds, type RichContent } from '@inzpro/rich-content/rich-content'

export const toResolvedRichContentDto = (content: RichContent): ResolvedRichContent => ({
  content,
  assets: imageAssetIds(content).map(id => ({ id, url: null })),
})
