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

export type SuspenseQueryProps<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = {
  options: UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  children: (data: TData) => ReactNode
  isDataEmpty: (data: TData) => boolean
  noDataFallback?: ReactNode
}

export function SuspenseQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>({
  options,
  children,
  isDataEmpty,
  noDataFallback,
}: SuspenseQueryProps<TQueryFnData, TError, TData, TQueryKey>) {
  const query = useSuspenseQuery(options)

  if (isDataEmpty(query.data)) {
    return noDataFallback ?? null
  }

  return children(query.data)
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
