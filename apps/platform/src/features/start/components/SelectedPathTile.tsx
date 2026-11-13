import { Badge } from '@inzpro/ui/components/badge'
import {
  Card,
  CardAction,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@inzpro/ui/components/card'
import { getExamAccessLabel } from '@inzpro/utils/exam-access'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

export const SelectedPathTile = () => {
  const { selectedPath } = onboardedRouteApi.useRouteContext()

  return (
    <Card className="col-span-6 @max-3xl:col-span-full">
      <CardHeader>
        <CardTitle>
          <h2>{selectedPath.specialization.name}</h2>
        </CardTitle>
        <CardDescription>
          {selectedPath.qualificationKind.name} • {selectedPath.qualificationScope.name}
        </CardDescription>
        <CardAction>
          <Badge
            variant="outline-primary"
            size="xs"
          >
            {getExamAccessLabel(selectedPath.accessScope)}
          </Badge>
        </CardAction>
      </CardHeader>
    </Card>
  )
}
