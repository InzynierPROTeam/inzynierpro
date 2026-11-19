import { Button } from '@inzpro/ui/components/button'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@inzpro/ui/components/item'
import {
  SectionHeader,
  SectionHeaderContent,
  SectionHeaderTitle,
  SectionHeaderDescription,
  SectionHeaderActions,
} from '@inzpro/ui/components/section-header'
import { Link } from '@tanstack/react-router'
import { Mail, UserRound } from 'lucide-react'
import { UserAvatar } from '~platform/components/UserAvatar'

import { profileRouteApi } from '../utils'
import { EditProfileNameDialog } from './EditProfileNameDialog'
import { ProfilePrivacyItem } from './ProfilePrivacyItem'
import { SignOutButton } from './SignOutButton'

export const ProfileDetailsSection = () => {
  const {
    session: { user },
  } = profileRouteApi.useRouteContext()

  return (
    <section className="app-layout-section gap-12">
      <SectionHeader>
        <SectionHeaderContent>
          <SectionHeaderTitle render={<h1 />}>Profil użytkownika</SectionHeaderTitle>
          <SectionHeaderDescription>Twoje dane i ustawienia konta</SectionHeaderDescription>
        </SectionHeaderContent>
        <SectionHeaderActions>
          <Button
            variant="ghost"
            nativeButton={false}
            render={
              <Link
                to="/uzytkownik/$userId"
                params={{ userId: user.id }}
              />
            }
          >
            <UserRound />
            Profil publiczny
          </Button>
          <SignOutButton />
        </SectionHeaderActions>
      </SectionHeader>
      <ItemGroup>
        <Item
          variant="background-soft"
          role="listitem"
        >
          <ItemMedia>
            <UserAvatar
              user={user}
              size="md"
            />
          </ItemMedia>
          <ItemContent className="gap-1">
            <ItemDescription className="text-xs">Nazwa</ItemDescription>
            <ItemTitle className="line-clamp-none break-words">{user.name}</ItemTitle>
          </ItemContent>
          <ItemActions>
            <EditProfileNameDialog />
          </ItemActions>
        </Item>
        <Item
          variant="background-soft"
          role="listitem"
        >
          <ItemMedia>
            <IconWrapper
              variant="background"
              size="sm"
            >
              <Mail />
            </IconWrapper>
          </ItemMedia>
          <ItemContent className="gap-1">
            <ItemDescription className="text-xs">E-mail</ItemDescription>
            <ItemTitle className="line-clamp-none break-all">{user.email}</ItemTitle>
          </ItemContent>
        </Item>
        <ProfilePrivacyItem />
      </ItemGroup>
    </section>
  )
}
