import { documentsInfiniteQueryOptions } from '@inzpro/queries/modules/written-study/queries'
import { Button } from '@inzpro/ui/components/button'
import { InView } from '@inzpro/ui/components/containers/in-view'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@inzpro/ui/components/empty'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import { ItemGroup } from '@inzpro/ui/components/item'
import { BookOpen, LoaderCircle } from 'lucide-react'
import {
  SuspenseInfiniteQuery,
  SuspenseQueryWrapper,
} from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { DocumentItem, DocumentItemSkeleton } from './DocumentItem'

export const Documents = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  return (
    <SuspenseQueryWrapper
      fallback={
        <ItemGroup>
          <DocumentItemSkeleton />
          <DocumentItemSkeleton />
          <DocumentItemSkeleton />
        </ItemGroup>
      }
    >
      <SuspenseInfiniteQuery
        options={documentsInfiniteQueryOptions(apiHttpClient, user.id, {
          query: {},
          params: { qualificationPathId: selectedPath.id },
        })}
        isDataEmpty={data => data.pages.every(page => page.data.length === 0)}
        noDataFallback={<EmptyDocuments />}
      >
        {({ data, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage }) => (
          <ItemGroup>
            {data.pages
              .flatMap(page => page.data)
              .map(document => (
                <DocumentItem
                  key={document.id}
                  document={document}
                />
              ))}
            {hasNextPage && !isFetchingNextPage && !isFetchNextPageError && (
              <InView fetchNextPage={() => void fetchNextPage()} />
            )}
            {isFetchingNextPage && (
              <IconWrapper
                className="self-center"
                role="status"
                aria-label="Wczytywanie kolejnych dokumentów"
              >
                <LoaderCircle className="animate-spin" />
              </IconWrapper>
            )}
            {isFetchNextPageError && (
              <Button
                variant="outline"
                className="self-center"
                onClick={() => void fetchNextPage()}
              >
                Spróbuj ponownie wczytać dokumenty
              </Button>
            )}
          </ItemGroup>
        )}
      </SuspenseInfiniteQuery>
    </SuspenseQueryWrapper>
  )
}

const EmptyDocuments = () => (
  <Empty className="w-full max-w-2xl self-center">
    <EmptyHeader>
      <EmptyMedia>
        <IconWrapper>
          <BookOpen />
        </IconWrapper>
      </EmptyMedia>
      <EmptyTitle>Brak dokumentów</EmptyTitle>
      <EmptyDescription>
        Dokumenty dla Twojej ścieżki nauki nie są jeszcze dostępne.
      </EmptyDescription>
    </EmptyHeader>
  </Empty>
)
