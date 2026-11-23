import type { UserQualificationPath } from '@inzpro/api-contracts/modules/preparation/responses'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@inzpro/ui/components/dialog'
import type React from 'react'

import { ResetPathForm } from './ResetPathForm'

type ResetPathDialogProps = {
  path: UserQualificationPath
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const ResetPathDialog: React.FC<ResetPathDialogProps> = ({ path, isOpen, onOpenChange }) => (
  <Dialog
    open={isOpen}
    onOpenChange={onOpenChange}
  >
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Zresetować postęp ścieżki?</DialogTitle>
        <DialogDescription>
          {path.specialization.name} • {path.qualificationKind.name} •{' '}
          {path.qualificationScope.name}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex flex-col gap-1">
          <p className="font-medium">Usuniemy z tej ścieżki, w części pisemnej i ustnej:</p>
          <ul className="text-muted-foreground list-disc pl-5">
            <li>sesje nauki i udzielone odpowiedzi,</li>
            <li>historię nauki, rundy i pokrycie pytań,</li>
            <li>powtórki,</li>
            <li>egzaminy próbne, także niedokończone,</li>
            <li>mini-quizy,</li>
            <li>plan dnia i jego ustawienia.</li>
          </ul>
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-medium">Zostaną:</p>
          <ul className="text-muted-foreground list-disc pl-5">
            <li>ścieżka i cel egzaminacyjny,</li>
            <li>notatki i ulubione pytania,</li>
            <li>inne ścieżki,</li>
            <li>zdobyte XP, odznaki i miejsce w rankingu,</li>
            <li>seria dni nauki i mostki serii.</li>
          </ul>
        </div>
        <p className="text-muted-foreground">
          Tej operacji nie można cofnąć. Nagrody za ukończone wcześniej rundy nie zostaną przyznane
          ponownie.
        </p>
      </div>
      <ResetPathForm
        path={path}
        onDone={() => onOpenChange(false)}
      />
    </DialogContent>
  </Dialog>
)
