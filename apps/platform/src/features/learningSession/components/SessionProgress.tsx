import type { StudySessionProgress } from '@inzpro/api-contracts/modules/study/responses'
import { Progress, ProgressLabel, ProgressValue } from '@inzpro/ui/components/progress'
import type React from 'react'

type SessionProgressProps = { progress: StudySessionProgress }

export const SessionProgress: React.FC<SessionProgressProps> = ({ progress }) => (
  <Progress
    value={progress.percent}
    size="sm"
  >
    <ProgressLabel>
      {progress.answered} / {progress.total}
    </ProgressLabel>
    <ProgressValue />
  </Progress>
)
