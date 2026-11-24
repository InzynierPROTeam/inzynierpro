import type {
  DocumentSection as DocumentSectionDto,
  ReferenceDocument as ReferenceDocumentDto,
  ResolvedRichContent,
} from '@inzpro/api-contracts/modules/learning-content/responses'
import { dateTimeUtcToUtcIsoDateTime } from '@inzpro/domain/common/date-time'
import { imageAssetIds, type RichContent } from '@inzpro/rich-content/rich-content'
import { Option } from 'effect'
import type { ContentAssetAddresses } from '~api/modules/learning-content/application/content-asset-addresses.service.js'
import type {
  DocumentSection,
  PublishedReferenceDocument,
} from '~api/modules/learning-content/domain/reference-document.model.js'

export const toResolvedRichContentDto = (
  content: RichContent,
  addresses: ContentAssetAddresses,
): ResolvedRichContent => ({
  content,
  assets: imageAssetIds(content).map(id => ({ id, url: addresses.get(id) ?? null })),
})

export const toReferenceDocumentDto = (
  document: PublishedReferenceDocument,
): ReferenceDocumentDto => ({
  ...document,
  description: Option.getOrNull(document.description),
  edition: {
    ...document.edition,
    effectiveFrom: dateTimeUtcToUtcIsoDateTime(document.edition.effectiveFrom),
  },
})

export const toDocumentSectionDtos = (
  sections: ReadonlyArray<DocumentSection>,
  addresses: ContentAssetAddresses,
): ReadonlyArray<DocumentSectionDto> =>
  sections.map(section => ({
    address: section.address,
    parentAddress: Option.getOrNull(section.parentAddress),
    title: Option.getOrNull(section.title),
    content: Option.match(section.content, {
      onNone: () => null,
      onSome: content => toResolvedRichContentDto(content, addresses),
    }),
  }))
