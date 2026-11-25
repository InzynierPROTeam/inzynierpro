import type {
  DocumentSection,
  QuestionReference,
} from '@inzpro/api-contracts/modules/learning-content/responses'
import {
  type DocumentPageCount,
  DocumentPageNumber,
  type EditionTextKind,
} from '@inzpro/domain/modules/learning-content/document-edition'
import {
  type DocumentSectionAddress,
  documentSectionLabel,
  enclosingUnitAddress,
} from '@inzpro/domain/modules/learning-content/document-section-address'
import type { ReferenceDocumentKind } from '@inzpro/domain/modules/learning-content/reference-document'
import { getRouteApi } from '@tanstack/react-router'
import { Option } from 'effect'

export const referenceDocumentRouteApi = getRouteApi(
  '/(app)/_authenticated/_onboarded/zrodla/$code',
)

const documentKindLabels = {
  statute: 'Ustawa',
  regulation: 'Rozporządzenie',
  standard: 'Norma',
  code: 'Kodeks',
  manual: 'Podręcznik',
  guideline: 'Wytyczne',
} satisfies Record<ReferenceDocumentKind, string>

export const documentKindLabel = (kind: ReferenceDocumentKind) => documentKindLabels[kind]

const textKindLabels = {
  official_consolidated: 'Tekst jednolity (urzędowy)',
  editorial_consolidation: 'Tekst ujednolicony redakcyjnie (nieurzędowy)',
  original: 'Tekst pierwotny',
} satisfies Record<EditionTextKind, string>

export const textKindLabel = (textKind: EditionTextKind) => textKindLabels[textKind]

export const sectionAnchor = (address: DocumentSectionAddress) => `jednostka-${address}`

export const isOutlineUnit = (section: DocumentSection) =>
  Option.isNone(enclosingUnitAddress(section.address))

export type SectionTree = ReadonlyMap<DocumentSectionAddress | null, ReadonlyArray<DocumentSection>>

export const sectionTree = (sections: ReadonlyArray<DocumentSection>): SectionTree => {
  const tree = new Map<DocumentSectionAddress | null, Array<DocumentSection>>()

  for (const section of sections) {
    const siblings = tree.get(section.parentAddress)

    if (siblings === undefined) {
      tree.set(section.parentAddress, [section])
    } else {
      siblings.push(section)
    }
  }

  return tree
}

export const viewerPageNumber = (
  requested: DocumentPageNumber | undefined,
  pageCount: DocumentPageCount | null,
): DocumentPageNumber =>
  DocumentPageNumber.make(
    pageCount === null ? (requested ?? 1) : Math.min(requested ?? 1, pageCount),
  )

export const questionReferenceLabel = ({ document, address, page }: QuestionReference) => {
  if (address !== null) {
    return `${document.abbreviation} ${documentSectionLabel(address)}`
  }

  return page === null ? document.abbreviation : `${document.abbreviation} s. ${page}`
}

export const questionReferenceSearch = ({ address, page }: QuestionReference) => {
  if (address !== null) {
    return { jednostka: address }
  }

  return page === null ? {} : { strona: page }
}

export const linkedQuestionsTitle = (questionCount: number) =>
  `Pytania na Twojej ścieżce (${questionCount})`
