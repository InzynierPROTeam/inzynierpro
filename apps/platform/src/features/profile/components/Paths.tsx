import type { GetPathsRes } from '@inzpro/api-client/modules/preparation'
import { maxUserQualificationPaths } from '@inzpro/domain/modules/preparation/config'
import { ItemGroup } from '@inzpro/ui/components/item'
import type React from 'react'

import { profileRouteApi } from '../utils'
import { Path } from './Path'

type PathsProps = {
  data: GetPathsRes
}

export const Paths: React.FC<PathsProps> = ({ data }) => {
  const { selectedPathId } = profileRouteApi.useRouteContext()
  const hasArchivedPath = data.data.some(path => path.archived)

  return (
    <div className="flex flex-col gap-6">
      {data.data.length >= maxUserQualificationPaths && (
        <p className="text-muted-foreground -mt-6 text-sm">
          Masz już maksymalną liczbę ścieżek ({maxUserQualificationPaths})
          {hasArchivedPath ? ', łącznie z archiwalnymi' : null}.
        </p>
      )}
      <ItemGroup>
        {data.data.map(path => (
          <Path
            key={path.id}
            path={path}
            isSelected={!path.archived && path.id === selectedPathId}
          />
        ))}
      </ItemGroup>
    </div>
  )
}
