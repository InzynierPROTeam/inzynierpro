import type { UserQualificationPath } from '@inzpro/api-contracts/modules/preparation/responses'
import { Button } from '@inzpro/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@inzpro/ui/components/dropdown-menu'
import { toast } from '@inzpro/ui/components/toast'
import {
  Archive,
  ArchiveRestore,
  Building2,
  Check,
  CircleX,
  Ellipsis,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { useSetDistrictChamber } from '~platform/features/chambers/hooks/useSetDistrictChamber'
import { useArchivePath } from '~platform/features/examPaths/hooks/useArchivePath'
import { useRestorePath } from '~platform/features/examPaths/hooks/useRestorePath'
import { useSelectPath } from '~platform/features/examPaths/hooks/useSelectPath'

import { profileRouteApi } from '../utils'
import { DistrictChamberDialog } from './DistrictChamberDialog'
import { ResetPathDialog } from './ResetPathDialog'

type PathActionsProps = {
  path: UserQualificationPath
  isSelected: boolean
}

export const PathActions: React.FC<PathActionsProps> = ({ path, isSelected }) => {
  const {
    session: { user },
  } = profileRouteApi.useRouteContext()

  const archive = useArchivePath(user.id)
  const restore = useRestorePath(user.id)
  const selectPath = useSelectPath(user.id)
  const setDistrictChamber = useSetDistrictChamber(user.id)
  const isPending = archive.isPending || restore.isPending || setDistrictChamber.isPending
  const [isResetOpen, setIsResetOpen] = useState(false)
  const [isDistrictChamberOpen, setIsDistrictChamberOpen] = useState(false)

  const toggleArchived = () =>
    toast.promise(
      (path.archived ? restore : archive).mutateAsync({
        params: { qualificationPathId: path.id },
      }),
      {
        loading: {
          title: path.archived ? 'Przywracanie ścieżki…' : 'Archiwizowanie ścieżki…',
        },
        success: {
          title: path.archived ? 'Ścieżka została przywrócona.' : 'Ścieżka została zarchiwizowana.',
        },
        error: { title: 'Nie udało się zaktualizować ścieżki.' },
      },
    )

  const clearDistrictChamber = () =>
    toast.promise(
      setDistrictChamber.mutateAsync({
        params: { qualificationPathId: path.id },
        payload: { districtChamberId: null },
      }),
      {
        loading: { title: 'Usuwanie izby okręgowej…' },
        success: { title: 'Usunięto izbę okręgową' },
        error: { title: 'Nie udało się usunąć izby. Spróbuj ponownie.' },
      },
    )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon-sm"
              disabled={isPending}
              aria-label={`Opcje ścieżki: ${path.name}`}
            />
          }
        >
          <Ellipsis />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={isSelected || path.archived || isPending}
            onClick={() => void selectPath(path.id)}
          >
            <Check /> Wybierz
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isPending}
            onClick={toggleArchived}
          >
            {path.archived ? <ArchiveRestore /> : <Archive />}
            {path.archived ? 'Przywróć' : 'Archiwizuj'}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={path.archived || isPending}
            onClick={() => setIsDistrictChamberOpen(true)}
          >
            <Building2 /> {path.districtChamber ? 'Zmień izbę okręgową' : 'Wybierz izbę okręgową'}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={path.archived || path.districtChamber === null || isPending}
            onClick={clearDistrictChamber}
          >
            <CircleX /> Usuń izbę okręgową
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isPending}
            onClick={() => setIsResetOpen(true)}
          >
            <RotateCcw /> Resetuj postęp
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* TODO: enable removal when the backend exposes an explicit delete-path operation. */}
          <DropdownMenuItem
            variant="destructive"
            disabled
          >
            <Trash2 /> Usuń
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ResetPathDialog
        path={path}
        isOpen={isResetOpen}
        onOpenChange={setIsResetOpen}
      />
      <DistrictChamberDialog
        path={path}
        isOpen={isDistrictChamberOpen}
        onOpenChange={setIsDistrictChamberOpen}
      />
    </>
  )
}
