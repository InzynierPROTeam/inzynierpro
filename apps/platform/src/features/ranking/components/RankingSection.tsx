import type { Ranking } from '@inzpro/api-contracts/modules/rankings/responses'
import {
  examSessionRankingQueryOptions,
  periodRankingQueryOptions,
} from '@inzpro/queries/modules/rankings/queries'
import {
  SectionHeader,
  SectionHeaderContent,
  SectionHeaderDescription,
  SectionHeaderTitle,
} from '@inzpro/ui/components/section-header'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { apiHttpClient } from '~platform/lib/api-client'

import { rankingPeriodOf, rankingRouteApi } from '../utils'
import { examSessionOption, thisWeekOption } from '../validation'
import { RankingList } from './RankingList'
import { RankingPeriodSwitcher } from './RankingPeriodSwitcher'

const renderRanking = (ranking: Ranking) => <RankingList ranking={ranking} />

export const RankingSection = () => {
  const {
    session: { user },
    selectedPath: { goal },
  } = rankingRouteApi.useRouteContext()

  const { okres = thisWeekOption } = rankingRouteApi.useSearch()

  return (
    <section className="app-layout-section gap-8">
      <SectionHeader>
        <SectionHeaderContent>
          <SectionHeaderTitle render={<h1 />}>Ranking</SectionHeaderTitle>
          <SectionHeaderDescription>
            {okres === examSessionOption
              ? `Punkty za naukę osób przygotowujących się do sesji: ${goal.sessionName}.`
              : 'Punkty za naukę zdobyte w wybranym okresie.'}
          </SectionHeaderDescription>
        </SectionHeaderContent>
      </SectionHeader>
      <RankingPeriodSwitcher />
      <SuspenseQueryWrapper>
        {okres === examSessionOption ? (
          <SuspenseQuery
            options={examSessionRankingQueryOptions(apiHttpClient, user.id, {
              params: { examSessionId: goal.examSessionId },
            })}
            isDataEmpty={() => false}
          >
            {renderRanking}
          </SuspenseQuery>
        ) : (
          <SuspenseQuery
            options={periodRankingQueryOptions(apiHttpClient, user.id, {
              params: { period: rankingPeriodOf[okres] },
            })}
            isDataEmpty={() => false}
          >
            {renderRanking}
          </SuspenseQuery>
        )}
      </SuspenseQueryWrapper>
    </section>
  )
}
