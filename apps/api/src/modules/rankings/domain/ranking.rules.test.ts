import { DateTime } from 'effect'
import { expect, test } from 'vitest'

import { rankingXpPeriod } from './ranking.rules.js'

test.each([
  {
    now: '2026-11-13T12:00:00Z',
    thisWeek: '2026-11-09',
    lastWeek: '2026-11-02',
    thisMonth: '2026-11-01',
    lastMonth: '2026-10-01',
  },
  {
    now: '2026-03-29T22:30:00Z',
    thisWeek: '2026-03-30',
    lastWeek: '2026-03-23',
    thisMonth: '2026-03-01',
    lastMonth: '2026-02-01',
  },
  {
    now: '2026-10-25T23:30:00Z',
    thisWeek: '2026-10-26',
    lastWeek: '2026-10-19',
    thisMonth: '2026-10-01',
    lastMonth: '2026-09-01',
  },
  {
    now: '2026-12-31T23:00:00Z',
    thisWeek: '2026-12-28',
    lastWeek: '2026-12-21',
    thisMonth: '2027-01-01',
    lastMonth: '2026-12-01',
  },
])(
  'rankings at $now read the Warsaw week and month and the ones before',
  ({ now, thisWeek, lastWeek, thisMonth, lastMonth }) => {
    const at = DateTime.makeUnsafe(now)

    expect(rankingXpPeriod('this_week', at)).toEqual({ kind: 'week', key: thisWeek })
    expect(rankingXpPeriod('last_week', at)).toEqual({ kind: 'week', key: lastWeek })
    expect(rankingXpPeriod('this_month', at)).toEqual({ kind: 'month', key: thisMonth })
    expect(rankingXpPeriod('last_month', at)).toEqual({ kind: 'month', key: lastMonth })
    expect(rankingXpPeriod('all_time', at)).toEqual({ kind: 'all_time', key: 'all' })
  },
)
