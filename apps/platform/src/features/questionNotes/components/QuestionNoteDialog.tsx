import type { SessionQuestion } from '@inzpro/api-contracts/modules/written-study/responses'
import { noteAssistanceKind } from '@inzpro/domain/modules/learning/study-session'
import { sessionQueryOptions } from '@inzpro/queries/modules/written-study/queries'
import { Alert, AlertDescription, AlertTitle } from '@inzpro/ui/components/alert'
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
import { History, NotebookPen } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { cx } from 'tailwind-variants'
import { useRecordSessionAssistance } from '~platform/features/learningSession/hooks/useRecordSessionAssistance'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { QuestionNoteForm } from './QuestionNoteForm'

type QuestionNoteDialogProps = { question: SessionQuestion }

export const QuestionNoteDialog: React.FC<QuestionNoteDialogProps> = ({ question }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const [isEditing, setIsEditing] = useState(false)

  const assistance = useRecordSessionAssistance(user.id, {
    params: {
      qualificationPathId: selectedPath.id,
      sessionId: question.sessionId,
      position: question.position,
    },
    payload: { kind: noteAssistanceKind },
  })

  const { data: session } = useQuery(
    sessionQueryOptions(apiHttpClient, user.id, {
      params: { qualificationPathId: selectedPath.id, sessionId: question.sessionId },
    }),
  )

  const needsAssistanceRecord =
    question.note !== null &&
    question.answer === null &&
    question.noteOpenedAt === null &&
    !question.isWithdrawn &&
    session?.status !== 'ended'

  const changeOpen = (open: boolean) => {
    setIsEditing(question.note === null)

    if (open && needsAssistanceRecord) {
      assistance.mutate()
    }
  }

  return (
    <Dialog onOpenChange={changeOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="icon-md"
          />
        }
      >
        <NotebookPen className={cx(question.note !== null && 'text-primary')} />
        <span className="sr-only">
          {question.note === null ? 'Dodaj notatkę' : 'Twoja notatka'}
        </span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Twoja notatka</DialogTitle>
          <DialogDescription>
            Notatka jest widoczna tylko dla Ciebie, przy tym pytaniu na każdej Twojej ścieżce.
          </DialogDescription>
        </DialogHeader>
        {question.note?.refersToEarlierWording === true && (
          <Alert>
            <History />
            <AlertTitle>Pytanie zmieniło się od ostatniej edycji notatki</AlertTitle>
            <AlertDescription>
              Notatka może dotyczyć wcześniejszego brzmienia pytania.
            </AlertDescription>
          </Alert>
        )}
        {isEditing || question.note === null ? (
          <QuestionNoteForm
            question={question}
            onDone={() => setIsEditing(false)}
          />
        ) : (
          <>
            <p className="text-sm">{question.note.text}</p>
            <DialogFooter
              showCloseButton
              className="flex-col"
            >
              <Button onClick={() => setIsEditing(true)}>Edytuj notatkę</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
