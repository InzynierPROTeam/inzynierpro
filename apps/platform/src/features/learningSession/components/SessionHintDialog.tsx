import type { SessionQuestion } from '@inzpro/api-contracts/modules/study/responses'
import { explanationAssistanceKind } from '@inzpro/domain/modules/study/study-session'
import { sessionQueryOptions } from '@inzpro/queries/modules/study'
import { Button } from '@inzpro/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@inzpro/ui/components/dialog'
import { useQuery } from '@tanstack/react-query'
import { Lightbulb } from 'lucide-react'
import type React from 'react'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { useRecordSessionAssistance } from '../hooks/useRecordSessionAssistance'

type SessionHintDialogProps = { question: SessionQuestion }

export const SessionHintDialog: React.FC<SessionHintDialogProps> = ({ question }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const assistance = useRecordSessionAssistance(user.id, {
    params: {
      qualificationPathId: selectedPath.id,
      sessionId: question.sessionId,
      position: question.position,
    },
    payload: { kind: explanationAssistanceKind },
  })

  const { data: session } = useQuery(
    sessionQueryOptions(apiHttpClient, user.id, {
      params: { qualificationPathId: selectedPath.id, sessionId: question.sessionId },
    }),
  )

  // Record while the session loads too; the backend ignores openings after the session ends.
  const needsAssistanceRecord =
    question.answer === null &&
    question.explanationOpenedAt === null &&
    !question.isWithdrawn &&
    session?.status !== 'ended'

  return (
    <Dialog
      onOpenChange={open => {
        if (open && needsAssistanceRecord) {
          assistance.mutate()
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="icon-md"
          />
        }
      >
        <Lightbulb />
        <span className="sr-only">Podpowiedź</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Podpowiedź</DialogTitle>
          <DialogDescription className="leading-relaxed whitespace-pre-line">
            {question.explanation}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}
