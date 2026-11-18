import {
  oralDailyPlanQueryOptions,
  oralReviewPreviewQueryOptions,
} from '@inzpro/queries/modules/oral-study/queries'
import { Link } from '@tanstack/react-router'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { DailyPlanSection, DailyPlanSectionSkeleton } from './DailyPlanSection'
import { DailyPlanSummary } from './DailyPlanSummary'

export const OralDailyPlan = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const params = { qualificationPathId: selectedPath.id }

  return (
    <DailyPlanSection title="Egzamin ustny">
      <SuspenseQueryWrapper fallback={<DailyPlanSectionSkeleton />}>
        <SuspenseQuery
          options={oralDailyPlanQueryOptions(apiHttpClient, user.id, { params })}
          isDataEmpty={() => false}
        >
          {plan => <DailyPlanSummary plan={plan} />}
        </SuspenseQuery>
      </SuspenseQueryWrapper>
      <SuspenseQueryWrapper fallback={null}>
        <SuspenseQuery
          options={oralReviewPreviewQueryOptions(apiHttpClient, user.id, { params, query: {} })}
          isDataEmpty={preview => preview === null || preview.dueQuestionCount === 0}
          noDataFallback={null}
        >
          {preview => (
            <Link
              to="/ustny/powtorka"
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
