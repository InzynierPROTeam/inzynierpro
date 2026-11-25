import { documentPackageCandidatesQueryOptions } from '@inzpro/queries/modules/learning-content/queries'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@inzpro/ui/components/empty'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import { TextSkeleton } from '@inzpro/ui/components/text-skeleton'
import { Library } from 'lucide-react'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { PackageBuilder } from './PackageBuilder'

export const DocumentPackage = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  return (
    <SuspenseQueryWrapper fallback={<DocumentPackageSkeleton />}>
      <SuspenseQuery
        options={documentPackageCandidatesQueryOptions(apiHttpClient, user.id, {
          params: { qualificationPathId: selectedPath.id },
        })}
        isDataEmpty={data => data.documents.length === 0}
        noDataFallback={<EmptyDocumentPackage />}
      >
        {({ documents }) => <PackageBuilder candidates={documents} />}
      </SuspenseQuery>
    </SuspenseQueryWrapper>
  )
}

const DocumentPackageSkeleton = () => (
  <div className="flex flex-col gap-3">
    <TextSkeleton
      size="sm"
      className="w-40"
    />
    <TextSkeleton
      size="sm"
      leading="snug"
      className="max-w-lg"
    />
    <TextSkeleton
      size="sm"
      leading="snug"
      className="max-w-lg"
    />
  </div>
)

const EmptyDocumentPackage = () => (
  <Empty className="w-full max-w-2xl self-center">
    <EmptyHeader>
      <EmptyMedia>
        <IconWrapper>
          <Library />
        </IconWrapper>
      </EmptyMedia>
      <EmptyTitle>Brak dokumentów</EmptyTitle>
      <EmptyDescription>
        Dokumenty źródłowe dla Twojej ścieżki nie są jeszcze dostępne.
      </EmptyDescription>
    </EmptyHeader>
  </Empty>
)
