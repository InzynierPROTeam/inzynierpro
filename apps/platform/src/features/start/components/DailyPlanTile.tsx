import { oralExamAccess, writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import { Card, CardContent, CardHeader, CardTitle } from '@inzpro/ui/components/card'
import { hasExamAccess } from '@inzpro/utils/exam-access'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

import { OralDailyPlan } from './OralDailyPlan'
import { WrittenDailyPlan } from './WrittenDailyPlan'

export const DailyPlanTile = () => {
  const { selectedPath } = onboardedRouteApi.useRouteContext()

  return (
    <Card
      role="region"
      aria-label="Plan na dziś"
      className="col-span-full"
    >
      <CardHeader>
        <CardTitle>
          <h2>Plan na dziś</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 @3xl:flex-row">
        {hasExamAccess(selectedPath.accessScope, writtenExamAccess) && <WrittenDailyPlan />}
        {hasExamAccess(selectedPath.accessScope, oralExamAccess) && <OralDailyPlan />}
      </CardContent>
    </Card>
  )
}
