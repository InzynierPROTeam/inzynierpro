import type { DailyPlan } from '@inzpro/api-contracts/modules/daily-plan/responses'
import { dailyPlanQueryOptions } from '@inzpro/queries/modules/written-study/queries'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Predicate } from 'effect'
import type React from 'react'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { changeWrittenPlanSettings } from '../actions'
import { DailyPlanSettingsDialog } from './DailyPlanSettingsDialog'

type WrittenDailyPlanSettingsProps = {
  plan: DailyPlan
}

export const WrittenDailyPlanSettings: React.FC<WrittenDailyPlanSettingsProps> = ({ plan }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const client = useQueryClient()
  const params = { qualificationPathId: selectedPath.id }
  const planQuery = dailyPlanQueryOptions(apiHttpClient, user.id, { params })

  const mutation = useMutation({
    mutationFn: changeWrittenPlanSettings,
    onSuccess: result => client.setQueryData(planQuery.queryKey, result),
    onError: error =>
      Predicate.isTagged(error, 'DailyPlanSettingsConflict') && client.invalidateQueries(planQuery),
  })

  return (
    <DailyPlanSettingsDialog
      settings={plan.settings}
      examDate={'examDate' in plan ? plan.examDate : null}
      save={payload => mutation.mutateAsync({ params, payload })}
    />
  )
}
