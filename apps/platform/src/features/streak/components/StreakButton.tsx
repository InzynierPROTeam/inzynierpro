import type { Streak } from '@inzpro/api-contracts/modules/streak/responses'
import { streakQueryOptions } from '@inzpro/queries/modules/streak/queries'
import { Button } from '@inzpro/ui/components/button'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@inzpro/ui/components/popover'
import { useQuery } from '@tanstack/react-query'
import { Flame } from 'lucide-react'
import { cx } from 'tailwind-variants'
import { authenticatedRouteApi } from '~platform/features/auth/utils'
import { apiHttpClient } from '~platform/lib/api-client'

const formatDays = (days: number) => `${days} ${days === 1 ? 'dzień' : 'dni'}`

export const StreakButton = () => {
  const {
    session: { user },
  } = authenticatedRouteApi.useRouteContext()

  const { data: streak } = useQuery(streakQueryOptions(apiHttpClient, user.id))

  if (streak === undefined) {
    return null
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="lg"
            aria-label={`Seria dni nauki: ${formatDays(streak.currentStreak)}`}
          />
        }
      >
        <Flame
          className={cx(
            'size-5',
            streak.todayQualifies && 'fill-orange-500 text-orange-500',
            !streak.todayQualifies && streak.pendingBridgeCount > 0 && 'text-orange-500/60',
            !streak.todayQualifies && streak.pendingBridgeCount === 0 && 'text-muted-foreground',
          )}
        />
        {streak.currentStreak}
      </PopoverTrigger>
      <PopoverContent align="end">
        <PopoverTitle>Seria dni nauki</PopoverTitle>
        <PopoverDescription>
          <TodayProgress streak={streak} />
        </PopoverDescription>
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Obecna seria</dt>
          <dd className="font-medium">{formatDays(streak.currentStreak)}</dd>
          <dt className="text-muted-foreground">Najdłuższa seria</dt>
          <dd className="font-medium">{formatDays(streak.longestStreak)}</dd>
          <dt className="text-muted-foreground">Mosty</dt>
          <dd className="font-medium">
            {streak.bridgeCount} z {streak.bridgeLimit}
          </dd>
        </dl>
      </PopoverContent>
    </Popover>
  )
}

type TodayProgressProps = {
  streak: Streak
}

const formatMissedDays = (days: number) =>
  days === 1 ? 'Wczoraj nie było nauki.' : `Ostatnie ${days} dni bez nauki.`

const formatBridges = (bridges: number) => `${bridges} ${bridges === 1 ? 'mostowi' : 'mostom'}`

const TodayProgress = ({ streak }: TodayProgressProps) => {
  if (streak.todayQualifies) {
    return 'Dzisiejszy dzień już się liczy do serii.'
  }

  const progress = `Dzisiaj: ${streak.todayAnswerCount} z ${streak.dailyAnswerThreshold} odpowiedzi potrzebnych do serii.`

  if (streak.pendingBridgeCount === 0) {
    return progress
  }

  return `${formatMissedDays(streak.pendingBridgeCount)} Zalicz dzisiejszy dzień, a seria przetrwa dzięki ${formatBridges(streak.pendingBridgeCount)}. ${progress}`
}
