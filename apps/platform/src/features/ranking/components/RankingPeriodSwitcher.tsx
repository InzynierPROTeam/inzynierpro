import { buttonVariants } from '@inzpro/ui/components/button'
import { Link } from '@tanstack/react-router'

import { rankingRouteApi } from '../utils'
import {
  allTimeOption,
  examSessionOption,
  lastMonthOption,
  lastWeekOption,
  type RankingPeriodOption,
  thisMonthOption,
  thisWeekOption,
} from '../validation'

const periods: ReadonlyArray<{ readonly label: string; readonly option: RankingPeriodOption }> = [
  { label: 'Ten tydzień', option: thisWeekOption },
  { label: 'Poprzedni tydzień', option: lastWeekOption },
  { label: 'Ten miesiąc', option: thisMonthOption },
  { label: 'Poprzedni miesiąc', option: lastMonthOption },
  { label: 'Moja sesja', option: examSessionOption },
  { label: 'Od początku', option: allTimeOption },
]

export const RankingPeriodSwitcher = () => {
  const { okres = thisWeekOption } = rankingRouteApi.useSearch()

  return (
    <nav
      aria-label="Okres rankingu"
      className="flex flex-wrap gap-2"
    >
      {periods.map(period => {
        const active = period.option === okres
        const variant = active ? 'primary' : 'outline'

        return (
          <Link
            key={period.option}
            to="/ranking"
            search={{ okres: period.option }}
            aria-current={active ? 'true' : undefined}
            className={buttonVariants({ size: 'sm', variant })}
          >
            {period.label}
          </Link>
        )
      })}
    </nav>
  )
}
