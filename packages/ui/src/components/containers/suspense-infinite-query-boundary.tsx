import {
  useSuspenseInfiniteQuery,
  type DefaultError,
  type InfiniteData,
  type QueryKey,
  type UseSuspenseInfiniteQueryOptions,
  type UseSuspenseInfiniteQueryResult,
} from '@tanstack/react-query'
import type { ReactNode } from 'react'

export type SuspenseInfiniteQueryProps<
  TPage,
  TError = DefaultError,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TData = InfiniteData<TPage>,
> = {
  options: UseSuspenseInfiniteQueryOptions<TPage, TError, TData, TQueryKey, TPageParam>
  children: (query: UseSuspenseInfiniteQueryResult<TData, TError>) => ReactNode
  isDataEmpty: (data: TData) => boolean
  noDataFallback?: ReactNode
}

export function SuspenseInfiniteQuery<
  TPage,
  TError = DefaultError,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TData = InfiniteData<TPage>,
>({
  options,
  children,
  isDataEmpty,
  noDataFallback,
}: SuspenseInfiniteQueryProps<TPage, TError, TQueryKey, TPageParam, TData>) {
  const query = useSuspenseInfiniteQuery(options)

  if (isDataEmpty(query.data)) {
    return noDataFallback ?? null
  }

  return children(query)
}

export type WithSuspenseInfiniteQueryProps<
  TPage,
  TError = DefaultError,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TData = InfiniteData<TPage>,
> = Pick<
  SuspenseInfiniteQueryProps<TPage, TError, TQueryKey, TPageParam, TData>,
  'options' | 'children'
>

export function WithSuspenseInfiniteQuery<
  TPage,
  TError = DefaultError,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TData = InfiniteData<TPage>,
>({
  options,
  children,
}: WithSuspenseInfiniteQueryProps<TPage, TError, TQueryKey, TPageParam, TData>) {
  return children(useSuspenseInfiniteQuery(options))
}
