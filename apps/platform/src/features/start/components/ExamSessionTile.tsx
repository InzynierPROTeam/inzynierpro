import { oralExamAccess, writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@inzpro/ui/components/card'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import { formatDate } from '@inzpro/utils/date'
import { CalendarDays } from 'lucide-react'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

export const ExamSessionTile = () => {
  const { selectedPath } = onboardedRouteApi.useRouteContext()
  const { goal } = selectedPath

  return (
    <Card className="gradient-brand text-primary-foreground col-span-6 justify-between bg-linear-to-br @max-3xl:col-span-full">
      <CardHeader>
        <IconWrapper
          size="sm"
          className="bg-background/20 text-current"
        >
          <CalendarDays />
        </IconWrapper>
        <CardTitle>
          <h2>{goal.sessionName}</h2>
        </CardTitle>
        <CardDescription className="text-current/70">Twoja sesja egzaminacyjna</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {selectedPath.accessScope !== oralExamAccess && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-current/70">Egzamin pisemny</span>
            <p className="text-base font-semibold">
              {!goal.sessionIsConfirmed && '~'}
              {formatDate(goal.writtenAt)}
            </p>
          </div>
        )}
        {selectedPath.accessScope !== writtenExamAccess && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-current/70">
              {goal.oralExamDate === null ? 'Orientacyjny termin ustnego' : 'Twój egzamin ustny'}
            </span>
            <p className="text-base font-semibold">
              {formatDate(goal.oralExamDate ?? goal.oralPlanningAt)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
