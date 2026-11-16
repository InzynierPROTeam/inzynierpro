import {
  easySelfAssessment,
  hardSelfAssessment,
  mediumSelfAssessment,
  type OralSelfAssessment,
} from '@inzpro/domain/modules/study/oral-study-session'
import { getRouteApi } from '@tanstack/react-router'
import { CircleCheck, CircleDashed, CircleAlert, type LucideIcon } from 'lucide-react'

export const oralSessionPreviewRouteApi = getRouteApi(
  '/(app)/_authenticated/_onboarded/_oralValid/ustny/start',
)

export const oralSessionQuestionRouteApi = getRouteApi(
  '/(app)/_authenticated/_onboarded/_oralValid/ustny/sesja/$sessionId/$questionNumber',
)

export const oralSessionSummaryRouteApi = getRouteApi(
  '/(app)/_authenticated/_onboarded/_oralValid/ustny/sesja/$sessionId/podsumowanie',
)

type SelfAssessmentLevel = {
  readonly label: string
  readonly description: string
  readonly Icon: LucideIcon
  readonly iconClassName: string
  readonly linkClassName: string
}

export const selfAssessmentLevels = {
  [hardSelfAssessment]: {
    label: 'Trudne',
    description: 'nie potrafisz jeszcze odpowiedzieć samodzielnie',
    Icon: CircleAlert,
    iconClassName: 'bg-warning/10 text-warning',
    linkClassName: 'border-warning/50 bg-warning/10 text-warning group-hover/result:bg-warning/20',
  },
  [mediumSelfAssessment]: {
    label: 'Średnie',
    description: 'odpowiadasz samodzielnie, ale z trudem',
    Icon: CircleDashed,
    iconClassName: 'bg-primary/10 text-primary',
    linkClassName: 'border-primary/50 bg-primary/10 text-primary group-hover/result:bg-primary/20',
  },
  [easySelfAssessment]: {
    label: 'Łatwe',
    description: 'odpowiadasz pewnie i wyczerpująco',
    Icon: CircleCheck,
    iconClassName: 'bg-success/10 text-success',
    linkClassName: 'border-success/50 bg-success/10 text-success group-hover/result:bg-success/20',
  },
} satisfies Record<OralSelfAssessment, SelfAssessmentLevel>
