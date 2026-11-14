import {
  QueryErrorResetBoundary,
  useSuspenseQuery,
  type DefaultError,
  type QueryKey,
  type UseSuspenseQueryOptions,
  type UseSuspenseQueryResult,
} from '@tanstack/react-query'
import { Suspense, type ReactNode, type SuspenseProps } from 'react'

import { ErrorBoundary } from './error-boundary.js'

export type ErrorFallbackProps = { error: Error; reset: () => void }

export type SuspenseQueryWrapperProps = SuspenseProps & {
  errorFallback?: (props: ErrorFallbackProps) => ReactNode
}

export function SuspenseQueryWrapper({ errorFallback, ...props }: SuspenseQueryWrapperProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallback={(error, retry) => errorFallback?.({ error, reset: retry }) ?? null}
        >
          <Suspense {...props} />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}

/** The data children receive: without the narrowed-out type when `isDataEmpty` is a type predicate. */
export type NonEmptyData<TData, TIsDataEmpty> = TIsDataEmpty extends ((
  data: TData,
) => data is infer TEmpty extends TData)
  ? Exclude<TData, TEmpty>
  : TData

export type SuspenseQueryProps<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TIsDataEmpty extends (data: TData) => boolean = (data: TData) => boolean,
> = {
  options: UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  /**
   * A check like `data => data === null` is inferred as a type predicate, so children get the data
   * without `null` and need no guard of their own.
   */
  isDataEmpty: TIsDataEmpty
  children: (data: NonEmptyData<TData, TIsDataEmpty>) => ReactNode
  noDataFallback?: ReactNode
}

export function SuspenseQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TIsDataEmpty extends (data: TData) => boolean = (data: TData) => boolean,
>({
  options,
  children,
  isDataEmpty,
  noDataFallback,
}: SuspenseQueryProps<TQueryFnData, TError, TData, TQueryKey, TIsDataEmpty>) {
  const query = useSuspenseQuery(options)

  if (isDataEmpty(query.data)) {
    return noDataFallback ?? null
  }

  // SAFETY: `isDataEmpty` returned false, so the data is not of the type its predicate names.
  return children(query.data as NonEmptyData<TData, TIsDataEmpty>)
}

export type WithSuspenseQueryProps<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = {
  options: UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  children: (query: UseSuspenseQueryResult<TData, TError>) => ReactNode
}

export function WithSuspenseQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>({ options, children }: WithSuspenseQueryProps<TQueryFnData, TError, TData, TQueryKey>) {
  return children(useSuspenseQuery(options))
}
