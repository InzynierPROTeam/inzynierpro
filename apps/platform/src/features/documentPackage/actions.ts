import { runApi } from '@inzpro/api-client/lib/run-api'
import {
  getReferenceDocument,
  getDocumentPdfDownload,
} from '@inzpro/api-client/modules/learning-content'
import type { DocumentPackageCandidate } from '@inzpro/api-contracts/modules/learning-content/responses'
import type { ReferenceDocumentCode } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { formatDate } from '@inzpro/utils/date'
import { Effect } from 'effect'
import { textKindLabel } from '~platform/features/sources/utils'
import { apiHttpClient } from '~platform/lib/api-client'
import { saveFile } from '~platform/lib/file-download'

import { assemblePackage, countPackagePages } from './lib/assemble-package'
import type { PackageDetails } from './lib/merge-pdfs'

const loadPackageDocument = (
  qualificationPathId: QualificationPathId,
  code: ReferenceDocumentCode,
) =>
  Effect.gen(function* () {
    const { document } = yield* getReferenceDocument({ params: { qualificationPathId, code } })

    return {
      title: document.title,
      editionLabel: document.edition.label,
      textKindLabel: textKindLabel(document.edition.textKind),
      effectiveDate: formatDate(document.edition.effectiveFrom),
      sourceUrl: document.edition.externalUrl,
    }
  })

export const countDocumentPackagePages = ({
  qualificationPathId,
  documents,
  ...details
}: PackageDetails & {
  readonly qualificationPathId: QualificationPathId
  readonly documents: ReadonlyArray<DocumentPackageCandidate>
}) =>
  Effect.gen(function* () {
    if (documents.length === 0) {
      return 0
    }

    const entries = yield* Effect.forEach(
      documents,
      candidate =>
        loadPackageDocument(qualificationPathId, candidate.code).pipe(
          Effect.map(document => ({ ...document, pageCount: candidate.pdf?.pageCount ?? 0 })),
        ),
      { concurrency: 'unbounded' },
    )

    return yield* countPackagePages({ type: 'count', documents: entries, ...details })
  })

export const downloadDocumentPackage = ({
  qualificationPathId,
  codes,
  fileName,
  ...details
}: PackageDetails & {
  readonly qualificationPathId: QualificationPathId
  readonly codes: ReadonlyArray<ReferenceDocumentCode>
  readonly fileName: string
}) =>
  runApi(
    Effect.gen(function* () {
      const documents = yield* Effect.forEach(
        codes,
        code =>
          Effect.gen(function* () {
            const [document, { url }] = yield* Effect.all(
              [
                loadPackageDocument(qualificationPathId, code),
                getDocumentPdfDownload({ params: { qualificationPathId, code } }),
              ],
              { concurrency: 'unbounded' },
            )

            return { ...document, url }
          }),
        { concurrency: 'unbounded' },
      )

      const file = yield* assemblePackage({ type: 'assemble', documents, ...details })
      yield* saveFile(new Blob([file], { type: 'application/pdf' }), fileName)
    }),
    apiHttpClient,
  )
