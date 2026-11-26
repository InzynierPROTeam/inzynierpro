import type { UserQualificationPath } from '@inzpro/api-contracts/modules/preparation/responses'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@inzpro/ui/components/dialog'
import type React from 'react'
import { SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { DistrictChamberChooser } from '~platform/features/chambers/components/DistrictChamberChooser'

type DistrictChamberDialogProps = {
  path: UserQualificationPath
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const DistrictChamberDialog: React.FC<DistrictChamberDialogProps> = ({
  path,
  isOpen,
  onOpenChange,
}) => (
  <Dialog
    open={isOpen}
    onOpenChange={onOpenChange}
  >
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Izba okręgowa</DialogTitle>
        <DialogDescription>
          {path.specialization.name} • {path.qualificationKind.name} •{' '}
          {path.qualificationScope.name}
        </DialogDescription>
      </DialogHeader>
      <SuspenseQueryWrapper>
        <DistrictChamberChooser
          path={path}
          onSaved={() => onOpenChange(false)}
        />
      </SuspenseQueryWrapper>
    </DialogContent>
  </Dialog>
)
