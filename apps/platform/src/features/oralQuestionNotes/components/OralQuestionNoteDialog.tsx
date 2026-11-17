import type { OralSessionQuestion } from '@inzpro/api-contracts/modules/oral-study/responses'
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
import { History, NotebookPen } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { cx } from 'tailwind-variants'

import { OralQuestionNoteForm } from './OralQuestionNoteForm'

type OralQuestionNoteDialogProps = { question: OralSessionQuestion }

export const OralQuestionNoteDialog: React.FC<OralQuestionNoteDialogProps> = ({ question }) => {
  const [isEditing, setIsEditing] = useState(false)

  const changeOpen = () => setIsEditing(question.note === null)

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
          <OralQuestionNoteForm
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
