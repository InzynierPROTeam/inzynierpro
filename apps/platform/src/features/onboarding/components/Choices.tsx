import type { QualificationKindId } from '@inzpro/domain/modules/qualification-paths/qualification-kind'
import type { SpecializationId } from '@inzpro/domain/modules/qualification-paths/specialization'
import { examSessionsQueryOptions } from '@inzpro/queries/modules/exam-calendar'
import {
  specializationsQueryOptions,
  qualificationKindsQueryOptions,
  qualificationScopesQueryOptions,
} from '@inzpro/queries/modules/qualification-paths'
import { useInfiniteQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { apiHttpClient } from '~platform/lib/api-client'

export type ChoiceState = {
  readonly choices: ReadonlyArray<{ readonly id: string; readonly name: string }>
  readonly pending: boolean
  readonly failed: boolean
  readonly retry: () => void
  readonly hasMore: boolean
  readonly loadingMore: boolean
  readonly loadMore: () => void
}

type CommonProps = {
  readonly children: (state: ChoiceState) => ReactNode
}

export const SpecializationChoices = ({ children }: CommonProps) => {
  const query = useInfiniteQuery(specializationsQueryOptions(apiHttpClient, { query: {} }))

  return children({
    choices: query.data?.pages.flatMap(page => page.data) ?? [],
    pending: query.isPending,
    failed: query.isError,
    retry: () => {
      void query.refetch()
    },
    hasMore: query.hasNextPage,
    loadingMore: query.isFetchingNextPage,
    loadMore: () => {
      void query.fetchNextPage()
    },
  })
}

export const KindChoices = ({
  children,
  specializationId,
}: CommonProps & { specializationId: SpecializationId }) => {
  const query = useInfiniteQuery(
    qualificationKindsQueryOptions(apiHttpClient, { query: { specializationId } }),
  )

  return children({
    choices: query.data?.pages.flatMap(page => page.data) ?? [],
    pending: query.isPending,
    failed: query.isError,
    retry: () => {
      void query.refetch()
    },
    hasMore: query.hasNextPage,
    loadingMore: query.isFetchingNextPage,
    loadMore: () => {
      void query.fetchNextPage()
    },
  })
}

export const ScopeChoices = ({
  children,
  specializationId,
  qualificationKindId,
}: CommonProps & {
  specializationId: SpecializationId
  qualificationKindId: QualificationKindId
}) => {
  const query = useInfiniteQuery(
    qualificationScopesQueryOptions(apiHttpClient, {
      query: { specializationId, qualificationKindId },
    }),
  )

  return children({
    choices: query.data?.pages.flatMap(page => page.data) ?? [],
    pending: query.isPending,
    failed: query.isError,
    retry: () => {
      void query.refetch()
    },
    hasMore: query.hasNextPage,
    loadingMore: query.isFetchingNextPage,
    loadMore: () => {
      void query.fetchNextPage()
    },
  })
}

export const SessionChoices = ({
  children,
  specializationId,
}: CommonProps & { specializationId: SpecializationId }) => {
  const query = useInfiniteQuery(
    examSessionsQueryOptions(apiHttpClient, { query: { specializationId } }),
  )

  return children({
    choices: query.data?.pages.flatMap(page => page.data) ?? [],
    pending: query.isPending,
    failed: query.isError,
    retry: () => {
      void query.refetch()
    },
    hasMore: query.hasNextPage,
    loadingMore: query.isFetchingNextPage,
    loadMore: () => {
      void query.fetchNextPage()
    },
  })
}
