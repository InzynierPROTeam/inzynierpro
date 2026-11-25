import type { QuestionNote } from '@inzpro/api-contracts/modules/learning/responses'
import { Alert, AlertDescription, AlertTitle } from '@inzpro/ui/components/alert'
import { Button } from '@inzpro/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@inzpro/ui/components/dialog'
import { History, NotebookPen } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { cx } from 'tailwind-variants'

import { QuestionDetailsNoteForm } from './QuestionDetailsNoteForm'

type QuestionDetailsNoteDialogProps = {
  note: QuestionNote | null
  isSaving: boolean
  onSave: (text: string) => Promise<{ readonly note: QuestionNote | null }>
}

export const QuestionDetailsNoteDialog: React.FC<QuestionDetailsNoteDialogProps> = ({
  note,
  isSaving,
  onSave,
}) => {
  const [open, setOpen] = useState(false)

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="icon-md"
          />
        }
      >
        <NotebookPen className={cx(note !== null && 'text-primary')} />
        <span className="sr-only">{note === null ? 'Dodaj notatkę' : 'Edytuj notatkę'}</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Twoja notatka</DialogTitle>
          <DialogDescription>
            Notatka jest prywatna i dostępna przy tym pytaniu na każdej Twojej ścieżce. Pusta treść
            usuwa notatkę.
          </DialogDescription>
        </DialogHeader>
        {note?.refersToEarlierWording === true && (
          <Alert>
            <History />
            <AlertTitle>Pytanie zmieniło się od ostatniej edycji notatki</AlertTitle>
            <AlertDescription>
              Notatka może dotyczyć wcześniejszego brzmienia pytania.
            </AlertDescription>
          </Alert>
        )}
        <QuestionDetailsNoteForm
          defaultText={note?.text ?? ''}
          isSaving={isSaving}
          onSave={onSave}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
