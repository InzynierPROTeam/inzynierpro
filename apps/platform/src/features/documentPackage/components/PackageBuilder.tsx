import type { DocumentPackageCandidate } from '@inzpro/api-contracts/modules/learning-content/responses'
import {
  SectionHeader,
  SectionHeaderContent,
  SectionHeaderTitle,
} from '@inzpro/ui/components/section-header'
import type React from 'react'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

import { usePackageSelection } from '../hooks/usePackageSelection'
import { selectedCandidates } from '../utils'
import { PackageDocumentList } from './PackageDocumentList'
import { PackageDownloadButton } from './PackageDownloadButton'
import { PackageOrderList } from './PackageOrderList'
import { PackageSummary } from './PackageSummary'

type PackageBuilderProps = { candidates: ReadonlyArray<DocumentPackageCandidate> }

export const PackageBuilder: React.FC<PackageBuilderProps> = ({ candidates }) => {
  const { selectedPath } = onboardedRouteApi.useRouteContext()

  const { selection, toggle, move, restoreDefault } = usePackageSelection(
    selectedPath.id,
    candidates,
  )

  const documents = selectedCandidates(selection, candidates)

  return (
    <div className="grid grid-cols-1 gap-10 @4xl:grid-cols-2">
      <section className="flex min-w-0 flex-col gap-4">
        <SectionHeader size="sm">
          <SectionHeaderContent>
            <SectionHeaderTitle render={<h2 />}>Dokumenty</SectionHeaderTitle>
          </SectionHeaderContent>
        </SectionHeader>
        <PackageDocumentList
          candidates={candidates}
          selection={selection}
          onToggle={toggle}
        />
      </section>
      <section className="flex min-w-0 flex-col gap-4">
        <SectionHeader size="sm">
          <SectionHeaderContent>
            <SectionHeaderTitle render={<h2 />}>Kolejność w pakiecie</SectionHeaderTitle>
          </SectionHeaderContent>
        </SectionHeader>
        {documents.length === 0 ? (
          <p className="text-muted-foreground text-sm">Zaznacz dokumenty, które chcesz pobrać.</p>
        ) : (
          <PackageOrderList
            documents={documents}
            onMove={move}
            onRestoreDefault={restoreDefault}
          />
        )}
        <PackageSummary documents={documents} />
        <PackageDownloadButton codes={documents.map(document => document.code)} />
      </section>
    </div>
  )
}
