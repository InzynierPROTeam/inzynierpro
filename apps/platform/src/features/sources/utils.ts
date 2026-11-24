import type { EditionTextKind } from '@inzpro/domain/modules/learning-content/document-edition'
import type { ReferenceDocumentKind } from '@inzpro/domain/modules/learning-content/reference-document'
import { getRouteApi } from '@tanstack/react-router'

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
