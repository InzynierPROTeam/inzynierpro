import { metadataOnlyAvailability } from '@inzpro/domain/modules/learning-content/document-edition'
import {
  downloadNotAllowedInPackage,
  includedInPackage,
  metadataOnlyInPackage,
  noPdfInPackage,
  type PackageAvailability,
} from '@inzpro/domain/modules/learning-content/document-package'
import { Option, Struct } from 'effect'

import type { DocumentPackageCandidate, PackageDocument } from './document-package.model.js'

export const packageAvailability = (
  edition: Pick<PackageDocument, 'contentAvailability' | 'downloadable' | 'pdf'>,
): PackageAvailability => {
  if (edition.contentAvailability === metadataOnlyAvailability) {
    return metadataOnlyInPackage
  }

  if (Option.isNone(edition.pdf)) {
    return noPdfInPackage
  }

  return edition.downloadable ? includedInPackage : downloadNotAllowedInPackage
}

export const toPackageCandidate = (document: PackageDocument): DocumentPackageCandidate => ({
  ...Struct.omit(document, ['contentAvailability', 'downloadable']),
  availability: packageAvailability(document),
})
