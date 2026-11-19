import type { PublicProfile as PublicProfileData } from '@inzpro/api-contracts/modules/profiles/responses'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import {
  Item,
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
} from '@inzpro/ui/components/section-header'
import { formatDate } from '@inzpro/utils/date'
import { Flame, Sparkles } from 'lucide-react'
import type React from 'react'
import { UserAvatar } from '~platform/components/UserAvatar'
import { EarnedBadges } from '~platform/features/learningXp/components/EarnedBadges'
import { formatDays } from '~platform/features/streak/utils'

type PublicProfileProps = { userId: UserId; profile: PublicProfileData }

export const PublicProfile: React.FC<PublicProfileProps> = ({ userId, profile }) => (
  <div className="flex flex-col gap-12">
    <div className="flex items-center gap-4">
      <UserAvatar
        user={{ id: userId, name: profile.name, image: profile.image }}
        size="lg"
      />
      <h1 className="text-2xl font-semibold break-words">{profile.name}</h1>
    </div>
    <ItemGroup
      aria-label="Statystyki"
      className="grid gap-4 sm:grid-cols-2"
    >
      <Item
        variant="background-soft"
        role="listitem"
      >
        <ItemMedia>
          <IconWrapper
            variant="background"
            size="sm"
          >
            <Sparkles />
          </IconWrapper>
        </ItemMedia>
        <ItemContent className="gap-1">
          <ItemDescription className="text-xs">Punkty za naukę</ItemDescription>
          <ItemTitle>{profile.totalXp} XP</ItemTitle>
        </ItemContent>
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
            <Flame />
          </IconWrapper>
        </ItemMedia>
        <ItemContent className="gap-1">
          <ItemDescription className="text-xs">Seria dni nauki</ItemDescription>
          <ItemTitle>{formatDays(profile.currentStreak)}</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>
    <div className="flex flex-col gap-6">
      <SectionHeader>
        <SectionHeaderContent>
          <SectionHeaderTitle render={<h2 />}>Odznaki</SectionHeaderTitle>
        </SectionHeaderContent>
      </SectionHeader>
      {profile.badges.length === 0 ? (
        <p className="text-muted-foreground text-sm">Brak zdobytych odznak.</p>
      ) : (
        <EarnedBadges badges={profile.badges} />
      )}
    </div>
    <div className="flex flex-col gap-6">
      <SectionHeader>
        <SectionHeaderContent>
          <SectionHeaderTitle render={<h2 />}>Ścieżki nauki</SectionHeaderTitle>
        </SectionHeaderContent>
      </SectionHeader>
      {profile.paths.length === 0 ? (
        <p className="text-muted-foreground text-sm">Brak aktywnych ścieżek.</p>
      ) : (
        <ItemGroup aria-label="Aktywne ścieżki nauki">
          {profile.paths.map(path => (
            <Item
              key={`${path.specialization.id}-${path.qualificationKind.id}-${path.qualificationScope.id}`}
              variant="background-soft"
              role="listitem"
            >
              <ItemContent>
                <ItemTitle className="line-clamp-none">{path.specialization.name}</ItemTitle>
                <ItemDescription className="line-clamp-none text-xs">
                  {path.qualificationKind.name} • {path.qualificationScope.name}
                </ItemDescription>
                <ItemDescription className="line-clamp-none text-xs">
                  Cel: {path.examSession.name} ({formatDate(path.examSession.writtenAt)})
                </ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      )}
    </div>
  </div>
)
