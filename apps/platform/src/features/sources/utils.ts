import type { DocumentSection } from '@inzpro/api-contracts/modules/learning-content/responses'
import type { EditionTextKind } from '@inzpro/domain/modules/learning-content/document-edition'
import {
  type DocumentSectionAddress,
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
