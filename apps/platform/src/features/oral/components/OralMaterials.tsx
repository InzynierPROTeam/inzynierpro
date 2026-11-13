import { oralMaterialsInfiniteQueryOptions } from '@inzpro/queries/modules/study'
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
import { Item, ItemContent, ItemTitle, ItemGroup } from '@inzpro/ui/components/item'
import { Skeleton } from '@inzpro/ui/components/skeleton'
import { LoaderCircle, Mic2 } from 'lucide-react'
import {
  SuspenseInfiniteQuery,
  SuspenseQueryWrapper,
} from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

export const OralMaterials = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  return (
    <SuspenseQueryWrapper
      fallback={
        <Item variant="background-soft">
          <ItemContent>
            <Skeleton className="h-5 w-64" />
          </ItemContent>
        </Item>
      }
    >
      <SuspenseInfiniteQuery
        options={oralMaterialsInfiniteQueryOptions(apiHttpClient, user.id, {
          query: {},
          params: { qualificationPathId: selectedPath.id },
        })}
        isDataEmpty={data => data.pages.every(page => page.data.length === 0)}
        noDataFallback={<EmptyOralMaterials />}
      >
        {({ data, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage }) => (
          <ItemGroup>
            {data.pages
              .flatMap(page => page.data)
              .map(category => (
                <Item
                  key={category.id}
                  variant="background-soft"
                >
                  <ItemContent>
                    <ItemTitle>
                      <h2>{category.name}</h2>
                    </ItemTitle>
                  </ItemContent>
                </Item>
              ))}
            {hasNextPage && !isFetchingNextPage && !isFetchNextPageError && (
              <InView fetchNextPage={() => void fetchNextPage()} />
            )}
            {isFetchingNextPage && (
              <IconWrapper
                className="self-center"
                role="status"
                aria-label="Wczytywanie kolejnych materiałów"
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
                Spróbuj ponownie wczytać materiały
              </Button>
            )}
          </ItemGroup>
        )}
      </SuspenseInfiniteQuery>
    </SuspenseQueryWrapper>
  )
}

const EmptyOralMaterials = () => (
  <Empty className="w-full max-w-2xl self-center">
    <EmptyHeader>
      <EmptyMedia>
        <IconWrapper>
          <Mic2 />
        </IconWrapper>
      </EmptyMedia>
      <EmptyTitle>Brak materiałów</EmptyTitle>
      <EmptyDescription>
        Materiały do egzaminu ustnego nie są jeszcze dostępne dla Twojej ścieżki nauki.
      </EmptyDescription>
    </EmptyHeader>
  </Empty>
)
