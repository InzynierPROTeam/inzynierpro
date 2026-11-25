import { metadataOnlyAvailability } from '@inzpro/domain/modules/learning-content/document-edition'
import {
  downloadNotAllowedInPackage,
  includedInPackage,
  metadataOnlyInPackage,
  noPdfInPackage,
  type PackageAvailability,
} from '@inzpro/domain/modules/learning-content/document-package'
import { Option } from 'effect'

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

export const toPackageCandidate = ({
  contentAvailability,
  downloadable,
  ...document
}: PackageDocument): DocumentPackageCandidate => ({
  ...document,
  availability: packageAvailability({ contentAvailability, downloadable, pdf: document.pdf }),
})
