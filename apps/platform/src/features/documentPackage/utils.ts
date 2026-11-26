import type { DocumentPackageCandidate } from '@inzpro/api-contracts/modules/learning-content/responses'
import { POLISH_LOCALE } from '@inzpro/config/localization'
import {
  includedInPackage,
  type PackageAvailability,
} from '@inzpro/domain/modules/learning-content/document-package'
import {
  type ReferenceDocumentCode,
  referenceDocumentKindValues,
} from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationKindCode } from '@inzpro/domain/modules/qualification-paths/qualification-kind'
import type { QualificationScopeCode } from '@inzpro/domain/modules/qualification-paths/qualification-scope'
import type { SpecializationCode } from '@inzpro/domain/modules/qualification-paths/specialization'
import { type DateInput, formatWarsawIsoDate } from '@inzpro/utils/date'
import { getKebabCaseInitials } from '@inzpro/utils/string'

export type PackageSelection = {
  readonly selected: ReadonlyArray<ReferenceDocumentCode>
  readonly excluded: ReadonlyArray<ReferenceDocumentCode>
}

export const largePackagePageCount = 2000

export type PackageUnavailability = Exclude<PackageAvailability, typeof includedInPackage>

const unavailabilityReasons = {
  metadata_only: 'Dostępny jest tylko opis tego dokumentu.',
  download_not_allowed: 'Tego dokumentu nie można pobrać.',
  no_pdf: 'Plik PDF tego dokumentu nie jest jeszcze dostępny.',
} satisfies Record<PackageUnavailability, string>

export const unavailabilityReason = (availability: PackageUnavailability) =>
  unavailabilityReasons[availability]

export const candidatesByKind = (candidates: ReadonlyArray<DocumentPackageCandidate>) =>
  referenceDocumentKindValues.flatMap(kind => {
    const group = candidates.filter(candidate => candidate.kind === kind)

    return group.length === 0 ? [] : [{ kind, candidates: group }]
  })

const includedCodes = (candidates: ReadonlyArray<DocumentPackageCandidate>) =>
  candidates.flatMap(candidate =>
    candidate.availability === includedInPackage ? [candidate.code] : [],
  )

export const defaultPackageSelection = (
  candidates: ReadonlyArray<DocumentPackageCandidate>,
): PackageSelection => ({ selected: includedCodes(candidates), excluded: [] })

export const reconcilePackageSelection = (
  stored: PackageSelection,
  candidates: ReadonlyArray<DocumentPackageCandidate>,
): PackageSelection => {
  const included = includedCodes(candidates)
  const selected = [...new Set(stored.selected)].filter(code => included.includes(code))

  const excluded = [...new Set(stored.excluded)].filter(
    code => included.includes(code) && !selected.includes(code),
  )

  const added = included.filter(code => !selected.includes(code) && !excluded.includes(code))

  return { selected: [...selected, ...added], excluded }
}

export const togglePackageDocument = (
  selection: PackageSelection,
  code: ReferenceDocumentCode,
): PackageSelection =>
  selection.selected.includes(code)
    ? {
        selected: selection.selected.filter(selected => selected !== code),
        excluded: [...selection.excluded, code],
      }
    : {
        selected: [...selection.selected, code],
        excluded: selection.excluded.filter(excluded => excluded !== code),
      }

export const movePackageDocument = (
  selection: PackageSelection,
  from: number,
  to: number,
): PackageSelection => {
  const moved = selection.selected[from]

  if (moved === undefined || to < 0 || to >= selection.selected.length || from === to) {
    return selection
  }

  const selected = selection.selected.toSpliced(from, 1).toSpliced(to, 0, moved)

  return { ...selection, selected }
}

export const restoreDefaultOrder = (
  selection: PackageSelection,
  candidates: ReadonlyArray<DocumentPackageCandidate>,
): PackageSelection => ({
  ...selection,
  selected: candidates.flatMap(({ code }) => (selection.selected.includes(code) ? [code] : [])),
})

export const selectedCandidates = (
  selection: PackageSelection,
  candidates: ReadonlyArray<DocumentPackageCandidate>,
) => selection.selected.flatMap(code => candidates.filter(candidate => candidate.code === code))

type PackagePath = {
  readonly specialization: { readonly code: SpecializationCode }
  readonly qualificationKind: { readonly code: QualificationKindCode }
  readonly qualificationScope: { readonly code: QualificationScopeCode }
}

export const pathAbbreviation = (path: PackagePath) =>
  [path.specialization.code, path.qualificationKind.code, path.qualificationScope.code]
    .map(code => getKebabCaseInitials(code, POLISH_LOCALE))
    .join('-')

export const packageFileName = (path: PackagePath, date: DateInput) =>
  `InzynierPRO-${pathAbbreviation(path)}-${formatWarsawIsoDate(date)}.pdf`

export const packagePathName = (path: {
  readonly specialization: { readonly name: string }
  readonly qualificationKind: { readonly name: string }
  readonly qualificationScope: { readonly name: string }
}) =>
  [path.specialization.name, path.qualificationKind.name, path.qualificationScope.name].join(' · ')
