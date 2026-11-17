import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@inzpro/ui/components/item'
import type React from 'react'

type SessionResultRowProps = {
  icon: React.ReactNode
  iconClassName?: string
  label: string
  value: string
}

export const SessionResultRow: React.FC<SessionResultRowProps> = ({
  icon,
  iconClassName,
  label,
  value,
}) => (
  <Item
    role="listitem"
    className="p-0"
  >
    <ItemMedia>
      <IconWrapper className={iconClassName}>{icon}</IconWrapper>
    </ItemMedia>
    <ItemContent className="gap-1">
      <ItemDescription>{label}</ItemDescription>
      <ItemTitle className="text-base font-normal">{value}</ItemTitle>
    </ItemContent>
  </Item>
)
