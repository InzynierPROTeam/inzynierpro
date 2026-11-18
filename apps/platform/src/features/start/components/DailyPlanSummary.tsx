import type { DailyPlan } from '@inzpro/api-contracts/modules/daily-plan/responses'
import { ratioToPercent } from '@inzpro/domain/common/percent'
import { calculateCompletionRatio } from '@inzpro/domain/common/progress'
import {
  examPassedDailyPlan,
  finalDaysDailyPlan,
  noMaterialDailyPlan,
  roundCompletedDailyPlan,
} from '@inzpro/domain/modules/daily-plan/daily-plan'
import { Button } from '@inzpro/ui/components/button'
import { CardDescription } from '@inzpro/ui/components/card'
import { Progress, ProgressLabel, ProgressValue } from '@inzpro/ui/components/progress'
import { formatDate } from '@inzpro/utils/date'
import { Link } from '@tanstack/react-router'
import type React from 'react'

type DailyPlanSummaryProps = {
  plan: DailyPlan
}

export const DailyPlanSummary: React.FC<DailyPlanSummaryProps> = ({ plan }) => {
  if (plan.status === noMaterialDailyPlan) {
    return (
      <CardDescription>Na tej ścieżce nie ma jeszcze materiału do zaplanowania.</CardDescription>
    )
  }

  if (plan.status === examPassedDailyPlan) {
    return (
      <div className="flex flex-col items-start gap-2">
        <CardDescription>
          Termin egzaminu ({formatDate(plan.examDate)}) minął. Zaktualizuj cel przygotowań, a
          zaplanujemy dalszą naukę.
        </CardDescription>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link to="/profil" />}
        >
          Zaktualizuj cel
        </Button>
      </div>
    )
  }

  if (plan.status === roundCompletedDailyPlan) {
    return (
      <div className="flex flex-col gap-2">
        <p>Runda nauki ukończona. Od jutra planujemy kolejną rundę.</p>
        <CardDescription>Odpowiedzi dziś: {plan.completedQuestionCount}</CardDescription>
        <CardDescription>Dni do egzaminu: {plan.daysUntilExam}</CardDescription>
      </div>
    )
  }

  if (plan.daysUntilExam === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p>Dziś egzamin. Powodzenia!</p>
        <CardDescription>Odpowiedzi dziś: {plan.completedQuestionCount}</CardDescription>
      </div>
    )
  }

  const surplus = plan.completedQuestionCount - plan.targetQuestionCount

  return (
    <div className="flex flex-col gap-2">
      <Progress
        value={ratioToPercent(
          calculateCompletionRatio(plan.completedQuestionCount, plan.targetQuestionCount),
        )}
        size="sm"
      >
        <ProgressLabel>
          Pytania na dziś: {plan.completedQuestionCount} / {plan.targetQuestionCount}
        </ProgressLabel>
        <ProgressValue />
      </Progress>
      {surplus > 0 && <p className="text-sm font-medium">Ponad plan: +{surplus}</p>}
      <CardDescription>Dni do egzaminu: {plan.daysUntilExam}</CardDescription>
      {plan.status === finalDaysDailyPlan && (
        <CardDescription>
          Ostatni tydzień przed egzaminem. Rozkładamy pytania do dnia przed egzaminem.
        </CardDescription>
      )}
      <CardDescription>
        {plan.questionsBehindPace > 0
          ? `Pytania do nadrobienia: ${plan.questionsBehindPace}`
          : 'Jesteś na bieżąco z planem.'}
      </CardDescription>
    </div>
  )
}
