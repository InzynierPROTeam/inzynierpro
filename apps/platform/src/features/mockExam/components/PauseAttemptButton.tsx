import { Button } from '@inzpro/ui/components/button'
import { Pause } from 'lucide-react'

import { usePauseAttempt } from '../hooks/useChangeAttemptPause'
import { attemptQuestionRouteApi } from '../utils'

export const PauseAttemptButton = () => {
  const { attemptId } = attemptQuestionRouteApi.useParams()
  const pause = usePauseAttempt(attemptId)

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pause.isPending}
      onClick={pause.change}
    >
      <Pause aria-hidden />
      Wstrzymaj egzamin
    </Button>
  )
}
