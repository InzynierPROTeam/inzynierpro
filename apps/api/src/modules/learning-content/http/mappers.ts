import type { ResolvedRichContent } from '@inzpro/api-contracts/modules/learning-content/responses'
import { imageAssetIds, type RichContent } from '@inzpro/rich-content/rich-content'
import type { ContentAssetAddresses } from '~api/modules/learning-content/application/content-asset-addresses.service.js'

export const toResolvedRichContentDto = (
  content: RichContent,
  addresses: ContentAssetAddresses,
): ResolvedRichContent => ({
  content,
  assets: imageAssetIds(content).map(id => ({ id, url: addresses.get(id) ?? null })),
})
