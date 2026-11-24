import { referenceDocumentsInfiniteQueryOptions } from '@inzpro/queries/modules/learning-content/queries'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@inzpro/ui/components/empty'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import { ItemGroup } from '@inzpro/ui/components/item'
import { Library } from 'lucide-react'
import { InfiniteQueryFooter } from '~platform/components/InfiniteQueryFooter'
import {
  SuspenseInfiniteQuery,
  SuspenseQueryWrapper,
} from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { ReferenceDocumentItem, ReferenceDocumentItemSkeleton } from './ReferenceDocumentItem'

export const ReferenceDocuments = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  return (
    <SuspenseQueryWrapper
      fallback={
        <ItemGroup>
          <ReferenceDocumentItemSkeleton />
          <ReferenceDocumentItemSkeleton />
          <ReferenceDocumentItemSkeleton />
        </ItemGroup>
      }
    >
      <SuspenseInfiniteQuery
        options={referenceDocumentsInfiniteQueryOptions(apiHttpClient, user.id, {
          params: { qualificationPathId: selectedPath.id },
          query: {},
        })}
        isDataEmpty={data => data.pages.every(page => page.data.length === 0)}
        noDataFallback={<EmptyReferenceDocuments />}
      >
        {({ data, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage }) => (
          <ItemGroup>
            {data.pages
              .flatMap(page => page.data)
              .map(document => (
                <ReferenceDocumentItem
                  key={document.id}
                  document={document}
                />
              ))}
            <InfiniteQueryFooter
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              isFetchNextPageError={isFetchNextPageError}
              fetchNextPage={() => void fetchNextPage()}
            />
          </ItemGroup>
        )}
      </SuspenseInfiniteQuery>
    </SuspenseQueryWrapper>
  )
}

const EmptyReferenceDocuments = () => (
  <Empty className="w-full max-w-2xl self-center">
    <EmptyHeader>
      <EmptyMedia>
        <IconWrapper>
          <Library />
        </IconWrapper>
      </EmptyMedia>
      <EmptyTitle>Brak źródeł</EmptyTitle>
      <EmptyDescription>
        Dokumenty źródłowe dla Twojej ścieżki nie są jeszcze dostępne.
      </EmptyDescription>
    </EmptyHeader>
  </Empty>
)
