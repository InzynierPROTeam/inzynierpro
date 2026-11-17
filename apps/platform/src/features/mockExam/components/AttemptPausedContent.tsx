import { Button } from '@inzpro/ui/components/button'
import { CardContent } from '@inzpro/ui/components/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@inzpro/ui/components/empty'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import { Pause, Play } from 'lucide-react'

import { useResumeAttempt } from '../hooks/useChangeAttemptPause'
import { attemptQuestionRouteApi } from '../utils'

export const AttemptPausedContent = () => {
  const { attemptId } = attemptQuestionRouteApi.useParams()
  const resume = useResumeAttempt(attemptId)

  return (
    <CardContent>
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <IconWrapper>
              <Pause />
            </IconWrapper>
          </EmptyMedia>
          <EmptyTitle>
            <h2>Egzamin wstrzymany</h2>
          </EmptyTitle>
          <EmptyDescription>
            Czas jest zatrzymany, a pytania ukryte do wznowienia. Przerwa nie obniża wyniku, ale
            podsumowanie pokaże liczbę i łączny czas przerw.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            disabled={resume.isPending}
            onClick={resume.change}
          >
            <Play aria-hidden />
            Wznów egzamin
          </Button>
        </EmptyContent>
      </Empty>
    </CardContent>
  )
}
