import type { DocumentPackageCandidate } from '@inzpro/api-contracts/modules/learning-content/responses'
import { includedInPackage } from '@inzpro/domain/modules/learning-content/document-package'
import type { ReferenceDocumentCode } from '@inzpro/domain/modules/learning-content/reference-document'
import { Badge } from '@inzpro/ui/components/badge'
import { Checkbox } from '@inzpro/ui/components/checkbox'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@inzpro/ui/components/item'
import type React from 'react'
import { useId } from 'react'
import { cx } from 'tailwind-variants'
import { documentKindGroupLabel } from '~platform/features/sources/utils'

import { candidatesByKind, type PackageSelection, unavailabilityReason } from '../utils'

type PackageDocumentListProps = {
  candidates: ReadonlyArray<DocumentPackageCandidate>
  selection: PackageSelection
  onToggle: (code: ReferenceDocumentCode) => void
}

export const PackageDocumentList: React.FC<PackageDocumentListProps> = ({
  candidates,
  selection,
  onToggle,
}) => (
  <div className="flex flex-col gap-6">
    {candidatesByKind(candidates).map(group => (
      <PackageDocumentGroup
        key={group.kind}
        label={documentKindGroupLabel(group.kind)}
      >
        {group.candidates.map(candidate => (
          <PackageDocumentItem
            key={candidate.id}
            candidate={candidate}
            checked={selection.selected.includes(candidate.code)}
            onToggle={onToggle}
          />
        ))}
      </PackageDocumentGroup>
    ))}
  </div>
)

type PackageDocumentGroupProps = { label: string; children: React.ReactNode }

const PackageDocumentGroup: React.FC<PackageDocumentGroupProps> = ({ label, children }) => {
  const labelId = useId()

  return (
    <div className="flex flex-col gap-3">
      <h3
        id={labelId}
        className="text-muted-foreground text-sm font-semibold"
      >
        {label}
      </h3>
      <ItemGroup
        aria-labelledby={labelId}
        className="gap-2"
      >
        {children}
      </ItemGroup>
    </div>
  )
}

type PackageDocumentItemProps = {
  candidate: DocumentPackageCandidate
  checked: boolean
  onToggle: (code: ReferenceDocumentCode) => void
}

const PackageDocumentItem: React.FC<PackageDocumentItemProps> = ({
  candidate,
  checked,
  onToggle,
}) => {
  const titleId = useId()
  const reasonId = useId()
  const { availability, pdf } = candidate
  const reason = availability === includedInPackage ? null : unavailabilityReason(availability)
  const included = reason === null

  return (
    <Item
      variant="background-soft"
      role="listitem"
      className={cx('items-start', !included && 'opacity-70')}
    >
      <ItemMedia className="pt-0.5">
        <Checkbox
          aria-labelledby={titleId}
          aria-describedby={included ? undefined : reasonId}
          checked={included && checked}
          disabled={!included}
          onCheckedChange={() => onToggle(candidate.code)}
        />
      </ItemMedia>
      <ItemContent className="gap-1.5">
        <Badge variant="outline-primary">{candidate.abbreviation}</Badge>
        <ItemTitle
          id={titleId}
          className="line-clamp-none"
        >
          {candidate.title}
        </ItemTitle>
        <ItemDescription className="line-clamp-none">
          {candidate.editionLabel}
          {pdf !== null && ` · Liczba stron: ${pdf.pageCount}`}
        </ItemDescription>
        {!included && (
          <ItemDescription
            id={reasonId}
            className="line-clamp-none"
          >
            {reason}
          </ItemDescription>
        )}
      </ItemContent>
    </Item>
  )
}
