import {
  fullContentAvailability,
  metadataOnlyAvailability,
  officialConsolidatedText,
  originalText,
} from '@inzpro/domain/modules/learning-content/document-edition'
import {
  ReferenceDocumentId,
  regulationDocument,
  standardDocument,
  statuteDocument,
} from '@inzpro/domain/modules/learning-content/reference-document'
import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

import { catalogueId } from './catalogue-id.js'
import { buildingLaw, technicalConditions } from './written-content.js'

const structuralDesignBasisStandard = ReferenceDocumentId.make(catalogueId('20', 3))

const referenceDocuments = [
  {
    id: buildingLaw,
    kind: statuteDocument,
    code: 'prawo-budowlane',
    abbreviation: 'PB',
    title: 'Ustawa z dnia 7 lipca 1994 r. — Prawo budowlane',
    description: null,
    edition: {
      id: catalogueId('21', 1),
      label: 'Dz.U. 2024 poz. 725 (t.j.)',
      textKind: officialConsolidatedText,
      effectiveFrom: '2024-05-15T22:00:00.000Z',
      externalUrl: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20240000725',
      availability: fullContentAvailability,
    },
  },
  {
    id: technicalConditions,
    kind: regulationDocument,
    code: 'warunki-techniczne',
    abbreviation: 'WT',
    title: 'Warunki techniczne, jakim powinny odpowiadać budynki i ich usytuowanie',
    description: null,
    edition: {
      id: catalogueId('21', 2),
      label: 'Dz.U. 2022 poz. 1225 (t.j.)',
      textKind: officialConsolidatedText,
      effectiveFrom: '2022-06-09T22:00:00.000Z',
      externalUrl: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20220001225',
      availability: fullContentAvailability,
    },
  },
  {
    id: structuralDesignBasisStandard,
    kind: standardDocument,
    code: 'pn-en-1990',
    abbreviation: 'PN-EN 1990',
    title: 'Eurokod. Podstawy projektowania konstrukcji',
    description:
      'Norma określa zasady i wymagania dotyczące bezpieczeństwa, użytkowalności i trwałości konstrukcji. Treść normy jest chroniona prawem autorskim, dlatego w aplikacji pokazujemy tylko jej opis. Pełny tekst można nabyć w Polskim Komitecie Normalizacyjnym.',
    edition: {
      id: catalogueId('21', 3),
      label: 'PN-EN 1990:2004',
      textKind: originalText,
      effectiveFrom: '2004-10-31T23:00:00.000Z',
      externalUrl: 'https://www.pkn.pl/',
      availability: metadataOnlyAvailability,
    },
  },
] as const

export const seedReferenceDocuments = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  for (const document of referenceDocuments) {
    const { edition } = document

    yield* sql`INSERT INTO reference_documents (id,kind,code,abbreviation,title,description)
        VALUES (${document.id},${document.kind},${document.code},${document.abbreviation},${document.title},${document.description})
        ON CONFLICT (id) DO UPDATE SET kind=EXCLUDED.kind,code=EXCLUDED.code,abbreviation=EXCLUDED.abbreviation,title=EXCLUDED.title,description=EXCLUDED.description`
    yield* sql`INSERT INTO document_editions (id,document_id,label,text_kind,effective_from,external_url,availability,downloadable,published_at)
        VALUES (${edition.id},${document.id},${edition.label},${edition.textKind},${edition.effectiveFrom},${edition.externalUrl},${edition.availability},false,clock_timestamp())
        ON CONFLICT (id) DO UPDATE SET label=EXCLUDED.label,text_kind=EXCLUDED.text_kind,effective_from=EXCLUDED.effective_from,external_url=EXCLUDED.external_url,availability=EXCLUDED.availability`
    yield* sql`UPDATE reference_documents SET current_edition_id=${edition.id} WHERE id=${document.id}`
  }
})
