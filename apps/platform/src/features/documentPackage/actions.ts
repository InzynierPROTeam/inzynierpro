import type { ReferenceDocumentCode } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { getPdfDownloadUrl } from '~platform/features/sources/actions'

import { assemblePackage, saveFile } from './lib/assemble-package'

export const downloadDocumentPackage = async ({
  qualificationPathId,
  codes,
  fileName,
}: {
  readonly qualificationPathId: QualificationPathId
  readonly codes: ReadonlyArray<ReferenceDocumentCode>
  readonly fileName: string
}) => {
  const addresses = await Promise.all(
    codes.map(code => getPdfDownloadUrl({ params: { qualificationPathId, code } })),
  )

  saveFile(await assemblePackage(addresses.map(({ url }) => url)), fileName)
}
