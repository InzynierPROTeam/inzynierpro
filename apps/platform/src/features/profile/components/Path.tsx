import type { UserQualificationPath } from '@inzpro/api-contracts/modules/preparation/responses'
import { Badge } from '@inzpro/ui/components/badge'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@inzpro/ui/components/item'
import { getExamAccessLabel } from '@inzpro/utils/exam-access'
import type React from 'react'

import { PathActions } from './PathActions'

type PathProps = {
  path: UserQualificationPath
  isSelected: boolean
}

export const Path: React.FC<PathProps> = ({ path, isSelected }) => (
  <Item
    role="listitem"
    variant={path.archived ? 'muted-soft' : 'background-soft'}
  >
    <ItemContent>
      {(isSelected || path.archived) && (
        <div className="-mb-1 flex items-center gap-2">
          {isSelected && (
            <Badge
              variant="outline-primary"
              size="sm"
            >
              Wybrana
            </Badge>
          )}
          {path.archived && (
            <Badge
              variant="outline-destructive"
              size="sm"
            >
              Nieaktywna
            </Badge>
          )}
        </div>
      )}
      <ItemTitle className="line-clamp-none">{path.specialization.name}</ItemTitle>
      <ItemDescription className="line-clamp-none text-xs">
        {path.qualificationKind.name} • {path.qualificationScope.name} •{' '}
        {getExamAccessLabel(path.accessScope)}
      </ItemDescription>
    </ItemContent>
    <ItemActions>
      <PathActions
        path={path}
        isSelected={isSelected}
      />
    </ItemActions>
  </Item>
)
