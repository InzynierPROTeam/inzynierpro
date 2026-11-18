import { learningXpQueryOptions } from '@inzpro/queries/modules/learning-xp/queries'
import {
  Empty,
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
} from '@inzpro/ui/components/section-header'
import { Award } from 'lucide-react'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { EarnedBadges } from '~platform/features/learningXp/components/EarnedBadges'
import { apiHttpClient } from '~platform/lib/api-client'

import { profileRouteApi } from '../utils'

export const ProfileBadgesSection = () => {
  const {
    session: { user },
  } = profileRouteApi.useRouteContext()

  return (
    <section className="app-layout-section gap-12">
      <SectionHeader>
        <SectionHeaderContent>
          <SectionHeaderTitle>Twoje odznaki</SectionHeaderTitle>
        </SectionHeaderContent>
      </SectionHeader>
      <SuspenseQueryWrapper>
        <SuspenseQuery
          options={learningXpQueryOptions(apiHttpClient, user.id)}
          noDataFallback={<NoBadges />}
          isDataEmpty={data => data.badges.length === 0}
        >
          {data => <EarnedBadges badges={data.badges} />}
        </SuspenseQuery>
      </SuspenseQueryWrapper>
    </section>
  )
}

const NoBadges = () => (
  <Empty>
    <EmptyHeader>
      <EmptyMedia>
        <IconWrapper>
          <Award />
        </IconWrapper>
      </EmptyMedia>
      <EmptyTitle>Nie masz jeszcze odznak</EmptyTitle>
      <EmptyDescription>
        Odznaki zdobywasz za ukończone sesje, rundy nauki, serie dni i zdane egzaminy próbne.
      </EmptyDescription>
    </EmptyHeader>
  </Empty>
)
