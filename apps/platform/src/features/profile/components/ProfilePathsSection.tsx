import { PageLimit } from '@inzpro/domain/common/pagination'
import { maxUserQualificationPaths } from '@inzpro/domain/modules/preparation/config'
import { pathsQueryOptions } from '@inzpro/queries/modules/preparation/queries'
import { Button } from '@inzpro/ui/components/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@inzpro/ui/components/empty'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import {
  SectionHeader,
  SectionHeaderContent,
  SectionHeaderTitle,
  SectionHeaderActions,
} from '@inzpro/ui/components/section-header'
import { Link } from '@tanstack/react-router'
import { Milestone, Plus } from 'lucide-react'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { apiHttpClient } from '~platform/lib/api-client'

import { profileRouteApi } from '../utils'
import { Paths } from './Paths'

export const ProfilePathsSection = () => {
  const {
    session: { user },
  } = profileRouteApi.useRouteContext()

  return (
    <section className="app-layout-section gap-12">
      <SectionHeader>
        <SectionHeaderContent>
          <SectionHeaderTitle>Twoje ścieżki nauki</SectionHeaderTitle>
        </SectionHeaderContent>
        <SectionHeaderActions>
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link to="/pierwsze-kroki" />}
          >
            <Plus />
            Dodaj ścieżkę
          </Button>
        </SectionHeaderActions>
      </SectionHeader>
      <SuspenseQueryWrapper>
        <SuspenseQuery
          options={pathsQueryOptions(apiHttpClient, user.id, {
            query: { limit: PageLimit.make(maxUserQualificationPaths) },
          })}
          noDataFallback={<EmptyList />}
          isDataEmpty={data => data.data.length === 0}
        >
          {data => <Paths data={data} />}
        </SuspenseQuery>
      </SuspenseQueryWrapper>
    </section>
  )
}

const EmptyList = () => (
  <Empty>
    <EmptyHeader>
      <EmptyMedia>
        <IconWrapper>
          <Milestone />
        </IconWrapper>
      </EmptyMedia>
      <EmptyTitle>Nie masz jeszcze przypisanych ścieżek</EmptyTitle>
      <EmptyDescription>Dodaj ścieżkę, aby rozpocząć przygotowania.</EmptyDescription>
    </EmptyHeader>
    <EmptyContent className="flex-row justify-center">
      <Button
        variant="border-primary"
        nativeButton={false}
        render={<Link to="/pierwsze-kroki" />}
      >
        <Plus />
        Dodaj ścieżkę
      </Button>
    </EmptyContent>
  </Empty>
)
