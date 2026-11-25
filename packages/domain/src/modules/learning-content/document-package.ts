import { Schema } from 'effect'

export const includedInPackage = 'included'
export const metadataOnlyInPackage = 'metadata_only'
export const downloadNotAllowedInPackage = 'download_not_allowed'
export const noPdfInPackage = 'no_pdf'

export const packageAvailabilityValues = [
  includedInPackage,
  metadataOnlyInPackage,
  downloadNotAllowedInPackage,
  noPdfInPackage,
] as const

export const PackageAvailability = Schema.Literals(packageAvailabilityValues)

export type PackageAvailability = typeof PackageAvailability.Type
