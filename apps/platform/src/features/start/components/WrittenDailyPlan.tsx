import { examPassedDailyPlan } from '@inzpro/domain/modules/daily-plan/daily-plan'
import {
  dailyPlanQueryOptions,
  reviewPreviewQueryOptions,
} from '@inzpro/queries/modules/written-study/queries'
import { Link } from '@tanstack/react-router'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { DailyPlanSection, DailyPlanSectionSkeleton } from './DailyPlanSection'
import { DailyPlanSummary } from './DailyPlanSummary'
import { WrittenDailyPlanSettings } from './WrittenDailyPlanSettings'

export const WrittenDailyPlan = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const params = { qualificationPathId: selectedPath.id }

  return (
    <DailyPlanSection title="Egzamin pisemny">
      <SuspenseQueryWrapper fallback={<DailyPlanSectionSkeleton />}>
        <SuspenseQuery
          options={dailyPlanQueryOptions(apiHttpClient, user.id, { params })}
          isDataEmpty={() => false}
        >
          {plan => (
            <>
              <DailyPlanSummary plan={plan} />
              {plan.status !== examPassedDailyPlan && <WrittenDailyPlanSettings plan={plan} />}
            </>
          )}
        </SuspenseQuery>
      </SuspenseQueryWrapper>
      <SuspenseQueryWrapper fallback={null}>
        <SuspenseQuery
          options={reviewPreviewQueryOptions(apiHttpClient, user.id, { params, query: {} })}
          isDataEmpty={preview => preview === null || preview.dueQuestionCount === 0}
          noDataFallback={null}
        >
          {preview => (
            <Link
              to="/nauka/powtorka"
              className="text-sm font-medium underline-offset-4 hover:underline"
            >
              Powtórki do zrobienia (poza planem): {preview?.dueQuestionCount}
            </Link>
          )}
        </SuspenseQuery>
      </SuspenseQueryWrapper>
    </DailyPlanSection>
  )
}
