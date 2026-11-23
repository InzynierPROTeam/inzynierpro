import type {
  Ranking,
  RankingEntry as RankingEntryData,
} from '@inzpro/api-contracts/modules/rankings/responses'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@inzpro/ui/components/empty'
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
import { Link } from '@tanstack/react-router'
import { EllipsisVertical, Trophy } from 'lucide-react'
import type React from 'react'
import { cx } from 'tailwind-variants'
import { UserAvatar } from '~platform/components/UserAvatar'

type RankingEntryProps = { entry: RankingEntryData; own: boolean }

const RankingEntry: React.FC<RankingEntryProps> = ({ entry, own }) => (
  <Item
    render={<li />}
    size="xs"
    variant="muted-soft"
    aria-current={own ? 'true' : undefined}
    className={cx(own && 'bg-primary/10')}
  >
    <ItemMedia className="text-muted-foreground w-8 justify-end text-sm font-medium tabular-nums">
      {entry.position}.
    </ItemMedia>
    <ItemMedia>
      <UserAvatar user={{ id: entry.userId, name: entry.name, image: entry.image }} />
    </ItemMedia>
    <ItemContent>
      <ItemTitle className="block truncate">
        {entry.profileVisible ? (
          <Link
            to="/uzytkownik/$userId"
            params={{ userId: entry.userId }}
            className="hover:underline"
          >
            {entry.name}
          </Link>
        ) : (
          entry.name
        )}
        {own && <span className="text-muted-foreground font-normal"> (Ty)</span>}
      </ItemTitle>
    </ItemContent>
    <ItemActions className="text-sm font-semibold tabular-nums">{entry.xp} XP</ItemActions>
  </Item>
)

type ViewerSummaryProps = { viewer: RankingEntryData | null }

const ViewerSummary: React.FC<ViewerSummaryProps> = ({ viewer }) => (
  <Item
    render={<section />}
    aria-label="Twój wynik"
    variant="muted"
  >
    <ItemMedia>
      <IconWrapper
        variant="background"
        size="sm"
      >
        <Trophy />
      </IconWrapper>
    </ItemMedia>
    {viewer === null ? (
      <ItemContent className="gap-1">
        <ItemTitle>Nie masz jeszcze punktów w tym okresie</ItemTitle>
        <ItemDescription>Zdobądź punkty za naukę, aby pojawić się w rankingu.</ItemDescription>
      </ItemContent>
    ) : (
      <ItemContent className="gap-1">
        <ItemTitle>Twoje miejsce: {viewer.position}.</ItemTitle>
        <ItemDescription>{viewer.xp} XP</ItemDescription>
      </ItemContent>
    )}
  </Item>
)

type RankingListProps = { ranking: Ranking }

export const RankingList: React.FC<RankingListProps> = ({ ranking: { entries, viewer } }) => {
  if (entries.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <IconWrapper>
              <Trophy />
            </IconWrapper>
          </EmptyMedia>
          <EmptyTitle>Ranking jest jeszcze pusty</EmptyTitle>
          <EmptyDescription>Nikt nie zdobył jeszcze punktów w tym okresie.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const ownEntryOutsideTop =
    viewer !== null && !entries.some(entry => entry.userId === viewer.userId) ? viewer : null

  return (
    <div className="flex flex-col gap-4">
      <ViewerSummary viewer={viewer} />
      <ItemGroup
        render={<ol />}
        aria-label="Ranking"
        className="gap-2"
      >
        {entries.map(entry => (
          <RankingEntry
            key={entry.userId}
            entry={entry}
            own={entry.userId === viewer?.userId}
          />
        ))}
      </ItemGroup>
      {ownEntryOutsideTop !== null && (
        <>
          <EllipsisVertical
            aria-hidden
            className="text-muted-foreground mx-auto size-5"
          />
          <ItemGroup
            render={<ol />}
            aria-label="Twoje miejsce"
            className="gap-2"
          >
            <RankingEntry
              entry={ownEntryOutsideTop}
              own
            />
          </ItemGroup>
        </>
      )}
    </div>
  )
}
