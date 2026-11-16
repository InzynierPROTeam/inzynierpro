import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@inzpro/ui/components/item'
import { Split } from 'lucide-react'
import type React from 'react'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

type SessionDetailsProps = { children: React.ReactNode }

export const SessionDetails: React.FC<SessionDetailsProps> = ({ children }) => (
  <ItemGroup
    render={<dl />}
    className="gap-8"
  >
    {children}
  </ItemGroup>
)

type SessionDetailProps = {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}

export const SessionDetail: React.FC<SessionDetailProps> = ({ icon, label, children }) => (
  <Item className="items-start p-0">
    <ItemMedia>
      <IconWrapper>{icon}</IconWrapper>
    </ItemMedia>
    <ItemContent className="gap-1">
      <ItemDescription render={<dt />}>{label}</ItemDescription>
      <ItemTitle
        render={<dd />}
        className="line-clamp-none text-base font-normal"
      >
        {children}
      </ItemTitle>
    </ItemContent>
  </Item>
)

export const SessionPathDetail = () => {
  const { selectedPath } = onboardedRouteApi.useRouteContext()

  return (
    <SessionDetail
      icon={<Split />}
      label="Specjalność"
    >
      {selectedPath.specialization.name} • {selectedPath.qualificationKind.name} •{' '}
      {selectedPath.qualificationScope.name}
    </SessionDetail>
  )
}
