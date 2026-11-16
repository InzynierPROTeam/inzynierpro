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
import { Archive, ArchiveRestore, Check, Ellipsis, Trash2 } from 'lucide-react'
import type React from 'react'
import { useArchivePath } from '~platform/features/examPaths/hooks/useArchivePath'
import { useRestorePath } from '~platform/features/examPaths/hooks/useRestorePath'
import { useSelectPath } from '~platform/features/examPaths/hooks/useSelectPath'

import { profileRouteApi } from '../utils'

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
  const isPending = archive.isPending || restore.isPending

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

  return (
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
  )
}
