import {
  aidReference,
  directBasisReference,
  type QuestionReferenceKind,
  topicReference,
} from '@inzpro/domain/modules/learning-content/question-reference'
import type { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

import { professionalSelfGovernmentAct } from './reference-documents.js'
import { buildingLaw, technicalConditions } from './written-content.js'

type SeedReference = {
  readonly documentId: ReferenceDocumentId
  readonly address: string | null
  readonly page: number | null
  readonly kind: QuestionReferenceKind
  readonly isCritical: boolean
}

const reference =
  (kind: QuestionReferenceKind, isCritical: boolean) =>
  (documentId: ReferenceDocumentId, address: string): SeedReference => ({
    documentId,
    address,
    page: null,
    kind,
    isCritical,
  })

const basis = reference(directBasisReference, true)

const aid = reference(aidReference, false)

const topic = reference(topicReference, false)

const aidPage = (documentId: ReferenceDocumentId, page: number): SeedReference => ({
  documentId,
  address: null,
  page,
  kind: aidReference,
  isCritical: false,
})

export const writtenQuestionReferences: ReadonlyArray<ReadonlyArray<SeedReference>> = [
  [
    basis(buildingLaw, 'art:17/pkt:3'),
    aid(buildingLaw, 'art:20/ust:1'),
    aidPage(professionalSelfGovernmentAct, 1),
  ],
  [
    basis(buildingLaw, 'art:24/ust:1'),
    aid(buildingLaw, 'art:17/pkt:4'),
    topic(buildingLaw, 'art:22'),
  ],
  [
    basis(technicalConditions, 'par:298/ust:2'),
    aid(technicalConditions, 'par:298'),
    topic(technicalConditions, 'par:68/ust:1'),
  ],
  [basis(buildingLaw, 'art:18/ust:1/pkt:5'), aid(buildingLaw, 'art:17/pkt:2')],
  [
    basis(buildingLaw, 'art:37/ust:1'),
    aid(buildingLaw, 'art:28/ust:1'),
    topic(buildingLaw, 'art:41/ust:1'),
  ],
  [basis(buildingLaw, 'art:82/ust:2'), aid(buildingLaw, 'art:82/ust:3')],
  [basis(technicalConditions, 'par:62/ust:1'), aid(technicalConditions, 'par:62')],
  [basis(technicalConditions, 'par:68/ust:1'), aid(technicalConditions, 'par:298/ust:2')],
  [basis(technicalConditions, 'par:68/ust:1'), aid(technicalConditions, 'par:68')],
  [basis(technicalConditions, 'par:72/ust:1'), aid(technicalConditions, 'par:57/ust:1')],
  [
    basis(buildingLaw, 'art:41/ust:1'),
    aid(buildingLaw, 'art:41/ust:2'),
    topic(buildingLaw, 'art:37/ust:1'),
  ],
  [basis(buildingLaw, 'art:45'), aid(buildingLaw, 'art:22/pkt:3')],
  [basis(buildingLaw, 'art:62/ust:1/pkt:2'), aid(buildingLaw, 'art:62/ust:1/pkt:1')],
  [basis(technicalConditions, 'par:12/ust:1/pkt:1'), aid(technicalConditions, 'par:12/ust:1')],
  [basis(technicalConditions, 'par:12/ust:1/pkt:2'), aid(technicalConditions, 'par:12/ust:1')],
  [basis(technicalConditions, 'par:57/ust:1'), aid(technicalConditions, 'par:57')],
]

export const writtenLaterRevisionReferences: ReadonlyMap<
  number,
  ReadonlyArray<SeedReference>
> = new Map([
  [6, [basis(buildingLaw, 'art:82/ust:2'), aid(buildingLaw, 'art:82/ust:3')]],
  [5, [basis(buildingLaw, 'art:37/ust:1'), aid(buildingLaw, 'art:37')]],
])

export const oralQuestionReferences: ReadonlyArray<ReadonlyArray<SeedReference>> = [
  [basis(buildingLaw, 'art:34/ust:3'), aid(buildingLaw, 'art:34')],
  [basis(buildingLaw, 'art:37/ust:1'), aid(buildingLaw, 'art:28/ust:1')],
  [
    basis(buildingLaw, 'art:28/ust:1'),
    aid(buildingLaw, 'art:29/ust:1'),
    aid(buildingLaw, 'art:30/ust:5'),
    topic(buildingLaw, 'art:35/ust:1'),
  ],
  [basis(buildingLaw, 'art:54/ust:1'), aid(buildingLaw, 'art:54')],
  [basis(buildingLaw, 'art:17'), aidPage(professionalSelfGovernmentAct, 1)],
  [basis(buildingLaw, 'art:20/ust:1'), aidPage(professionalSelfGovernmentAct, 2)],
  [basis(buildingLaw, 'art:20/ust:1/pkt:4'), aid(buildingLaw, 'art:20')],
  [basis(buildingLaw, 'art:22'), aid(buildingLaw, 'art:24/ust:1'), topic(buildingLaw, 'art:45')],
  [basis(technicalConditions, 'par:12/ust:1'), aid(technicalConditions, 'par:12/ust:1/pkt:1')],
  [basis(technicalConditions, 'par:68/ust:1'), aid(technicalConditions, 'par:298/ust:2')],
  [basis(technicalConditions, 'par:62/ust:1'), aid(technicalConditions, 'par:62')],
  [basis(technicalConditions, 'par:72/ust:1'), aid(technicalConditions, 'par:72')],
]

export const oralSubstantiveRevisionReferences: ReadonlyArray<SeedReference> = [
  basis(buildingLaw, 'art:37/ust:1'),
  aid(buildingLaw, 'art:37'),
]

export const seedQuestionReferences = Effect.fn('seedQuestionReferences')(function* (
  revision: { readonly writtenRevisionId: string } | { readonly oralRevisionId: string },
  references: ReadonlyArray<SeedReference>,
) {
  const sql = yield* SqlClient.SqlClient
  const writtenRevisionId = 'writtenRevisionId' in revision ? revision.writtenRevisionId : null
  const oralRevisionId = 'oralRevisionId' in revision ? revision.oralRevisionId : null

  for (const [index, entry] of references.entries()) {
    yield* sql`INSERT INTO question_references (written_revision_id,oral_revision_id,position,document_id,address,pdf_page,kind,is_critical)
      VALUES (${writtenRevisionId},${oralRevisionId},${index + 1},${entry.documentId},${entry.address},${entry.page},${entry.kind},${entry.isCritical})`
  }
})
