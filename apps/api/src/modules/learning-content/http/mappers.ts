import type {
  DocumentPackageCandidate as DocumentPackageCandidateDto,
  DocumentSection as DocumentSectionDto,
  LinkedOralQuestion as LinkedOralQuestionDto,
  QuestionReference as QuestionReferenceDto,
  ReferenceDocument as ReferenceDocumentDto,
  ResolvedRichContent,
} from '@inzpro/api-contracts/modules/learning-content/responses'
import { dateTimeUtcToUtcIsoDateTime } from '@inzpro/domain/common/date-time'
import { imageAssetIds, type RichContent } from '@inzpro/rich-content/rich-content'
import { Option } from 'effect'
import type { ContentAssetAddresses } from '~api/modules/learning-content/application/content-asset-addresses.service.js'
import type { DocumentPackageCandidate } from '~api/modules/learning-content/domain/document-package.model.js'
import type { LinkedOralQuestion } from '~api/modules/learning-content/domain/linked-question.model.js'
import type { QuestionReference } from '~api/modules/learning-content/domain/question-reference.model.js'
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
  id: document.id,
  code: document.code,
  kind: document.kind,
  abbreviation: document.abbreviation,
  title: document.title,
  description: Option.getOrNull(document.description),
  edition: {
    id: document.edition.id,
    label: document.edition.label,
    textKind: document.edition.textKind,
    effectiveFrom: dateTimeUtcToUtcIsoDateTime(document.edition.effectiveFrom),
    externalUrl: document.edition.externalUrl,
    availability: document.edition.availability,
    downloadable: document.edition.downloadable,
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

export const questionReferenceContents = (references: ReadonlyArray<QuestionReference>) =>
  references.flatMap(reference =>
    Option.getOrElse(reference.fragment, () => []).flatMap(section =>
      Option.toArray(section.content),
    ),
  )

export const toQuestionReferenceDto = (
  reference: QuestionReference,
  addresses: ContentAssetAddresses,
): QuestionReferenceDto => ({
  document: {
    code: reference.documentCode,
    abbreviation: reference.documentAbbreviation,
    title: reference.documentTitle,
  },
  address: Option.getOrNull(reference.address),
  page: Option.getOrNull(reference.page),
  kind: reference.kind,
  isCritical: reference.isCritical,
  isLinked: reference.isLinked,
  fragment: Option.match(reference.fragment, {
    onNone: () => null,
    onSome: sections => toDocumentSectionDtos(sections, addresses),
  }),
})

export const toLinkedOralQuestionDto = (
  question: LinkedOralQuestion,
  addresses: ContentAssetAddresses,
): LinkedOralQuestionDto => ({
  ...question,
  body: toResolvedRichContentDto(question.body, addresses),
})

export const toDocumentPackageCandidateDto = (
  candidate: DocumentPackageCandidate,
): DocumentPackageCandidateDto => ({
  ...candidate,
  pdf: Option.getOrNull(candidate.pdf),
})
