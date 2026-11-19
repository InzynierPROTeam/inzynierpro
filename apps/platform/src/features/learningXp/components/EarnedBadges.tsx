import type { EarnedBadge } from '@inzpro/api-contracts/modules/learning-xp/responses'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@inzpro/ui/components/item'
import { formatDate } from '@inzpro/utils/date'
import { Award } from 'lucide-react'

import { badgeNames } from '../config/badges'

type EarnedBadgesProps = {
  readonly badges: ReadonlyArray<Pick<EarnedBadge, 'code'> & Partial<Pick<EarnedBadge, 'earnedAt'>>>
}

export const EarnedBadges = ({ badges }: EarnedBadgesProps) => (
  <ItemGroup aria-label="Zdobyte odznaki">
    {badges.map(badge => (
      <Item
        key={badge.code}
        variant="background-soft"
        role="listitem"
      >
        <ItemMedia>
          <IconWrapper
            variant="background"
            size="sm"
          >
            <Award />
          </IconWrapper>
        </ItemMedia>
        <ItemContent className="gap-1">
          <ItemTitle>{badgeNames[badge.code]}</ItemTitle>
          {badge.earnedAt && (
            <ItemDescription className="text-xs">
              Zdobyta {formatDate(badge.earnedAt)}
            </ItemDescription>
          )}
        </ItemContent>
      </Item>
    ))}
  </ItemGroup>
)
