import { Button } from '@inzpro/ui/components/button'
import {
  SuspenseInfiniteQuery as SuspenseInfiniteQueryBase,
  type SuspenseInfiniteQueryProps,
} from '@inzpro/ui/components/containers/suspense-infinite-query-boundary'
import {
  SuspenseQuery as SuspenseQueryBase,
  SuspenseQueryWrapper as SuspenseQueryWrapperBase,
  type SuspenseQueryProps,
  type SuspenseQueryWrapperProps,
  type ErrorFallbackProps,
} from '@inzpro/ui/components/containers/suspense-query-boundary'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@inzpro/ui/components/empty'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import type { DefaultError, InfiniteData, QueryKey } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { CircleAlert, Inbox } from 'lucide-react'

export const DefaultNoDataFallback = () => (
  <Empty>
    <EmptyHeader>
      <EmptyMedia>
        <IconWrapper>
          <Inbox />
        </IconWrapper>
      </EmptyMedia>
      <EmptyTitle>Nic tu jeszcze nie ma</EmptyTitle>
      <EmptyDescription>Ta sekcja nie zawiera jeszcze żadnych danych.</EmptyDescription>
    </EmptyHeader>
  </Empty>
)

export const DefaultErrorFallback = ({ reset }: ErrorFallbackProps) => (
  <Empty role="alert">
    <EmptyHeader>
      <EmptyMedia>
        <IconWrapper>
          <CircleAlert />
        </IconWrapper>
      </EmptyMedia>
      <EmptyTitle>Nie udało się wczytać danych</EmptyTitle>
      <EmptyDescription>Spróbuj ponownie lub wróć na stronę główną.</EmptyDescription>
    </EmptyHeader>
    <EmptyContent className="flex-row justify-center">
      <Button onClick={reset}>Spróbuj ponownie</Button>
      <Button
        variant="outline"
        nativeButton={false}
        render={<Link to="/" />}
      >
        Zacznij od początku
      </Button>
    </EmptyContent>
  </Empty>
)

export function SuspenseQueryWrapper({ errorFallback, ...props }: SuspenseQueryWrapperProps) {
  return (
    <SuspenseQueryWrapperBase
      errorFallback={errorFallback ?? (props => <DefaultErrorFallback {...props} />)}
      {...props}
    />
  )
}

export function SuspenseQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TIsDataEmpty extends (data: TData) => boolean = (data: TData) => boolean,
>({
  noDataFallback,
  ...props
}: SuspenseQueryProps<TQueryFnData, TError, TData, TQueryKey, TIsDataEmpty>) {
  return (
    <SuspenseQueryBase
      noDataFallback={noDataFallback === undefined ? <DefaultNoDataFallback /> : noDataFallback}
      {...props}
    />
  )
}

export function SuspenseInfiniteQuery<
  TPage,
  TError = DefaultError,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TData = InfiniteData<TPage>,
>({
  noDataFallback,
  ...props
}: SuspenseInfiniteQueryProps<TPage, TError, TQueryKey, TPageParam, TData>) {
  return (
    <SuspenseInfiniteQueryBase
      noDataFallback={noDataFallback === undefined ? <DefaultNoDataFallback /> : noDataFallback}
      {...props}
    />
  )
}
