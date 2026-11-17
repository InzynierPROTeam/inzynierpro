import type { AttemptReviewQuestion } from '@inzpro/api-contracts/modules/mock-exams/responses'
import { Button } from '@inzpro/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@inzpro/ui/components/dialog'
import { NotebookPen } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'

import { AttemptNoteForm } from './AttemptNoteForm'

type AttemptNoteDialogProps = { question: AttemptReviewQuestion }

export const AttemptNoteDialog: React.FC<AttemptNoteDialogProps> = ({ question }) => {
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
        <NotebookPen />
        <span className="sr-only">
          {question.note === null ? 'Dodaj notatkę' : 'Edytuj notatkę'}
        </span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Twoja notatka</DialogTitle>
          <DialogDescription>
            Notatka jest prywatna i dostępna przy tym pytaniu na każdej Twojej ścieżce. Pusta treść
            usuwa notatkę.
          </DialogDescription>
        </DialogHeader>
        <AttemptNoteForm
          question={question}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
