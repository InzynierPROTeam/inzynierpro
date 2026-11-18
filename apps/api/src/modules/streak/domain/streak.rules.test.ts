import { BridgeCount, DailyAnswerCount, StreakLength } from '@inzpro/domain/modules/streak/streak'
import { DateTime, Option } from 'effect'
import { describe, expect, it } from 'vitest'
import type { StreakRecord } from '~api/modules/streak/domain/streak.model.js'
import {
  coveredMissedDays,
  grantedBridges,
  qualifiesStudyDay,
  reachesStreakMilestone,
  streakOf,
  streakRecordOf,
} from '~api/modules/streak/domain/streak.rules.js'

const at = DateTime.makeUnsafe

const iso = (value: DateTime.Utc) => DateTime.formatIso(value)

const day = (warsawMidnight: string) => at(warsawMidnight)

const record = (current: number, longest: number, lastQualifyingDay: string): StreakRecord => ({
  currentStreak: StreakLength.make(current),
  longestStreak: StreakLength.make(longest),
  lastQualifyingDay: day(lastQualifyingDay),
})

const answers = (count: number) => DailyAnswerCount.make(count)

const bridges = (count: number) => BridgeCount.make(count)

describe('a qualifying day', () => {
  it('needs five answers', () => {
    expect(qualifiesStudyDay(answers(4))).toBe(false)
    expect(qualifiesStudyDay(answers(5))).toBe(true)
    expect(qualifiesStudyDay(answers(12))).toBe(true)
  })
})

describe('the stored streak', () => {
  it('is absent before the first qualifying day', () => {
    expect(streakRecordOf([], [])).toEqual(Option.none())
  })

  it('counts consecutive Europe/Warsaw days', () => {
    const stored = streakRecordOf(
      [
        day('2026-11-10T23:00:00.000Z'),
        day('2026-11-11T23:00:00.000Z'),
        day('2026-11-12T23:00:00.000Z'),
      ],
      [],
    )

    expect(
      Option.map(stored, ({ lastQualifyingDay, ...lengths }) => ({
        ...lengths,
        lastQualifyingDay: iso(lastQualifyingDay),
      })),
    ).toEqual(
      Option.some({
        currentStreak: 3,
        longestStreak: 3,
        lastQualifyingDay: '2026-11-12T23:00:00.000Z',
      }),
    )
  })

  it('starts again after a missed day and keeps the longest run', () => {
    const stored = streakRecordOf(
      [
        day('2026-11-05T23:00:00.000Z'),
        day('2026-11-06T23:00:00.000Z'),
        day('2026-11-07T23:00:00.000Z'),
        day('2026-11-09T23:00:00.000Z'),
        day('2026-11-10T23:00:00.000Z'),
      ],
      [],
    )

    expect(
      Option.map(stored, ({ currentStreak, longestStreak }) => ({ currentStreak, longestStreak })),
    ).toEqual(Option.some({ currentStreak: 2, longestStreak: 3 }))
  })

  it('joins days across the switch from summer to winter time', () => {
    const stored = streakRecordOf(
      [
        day('2026-10-23T22:00:00.000Z'),
        day('2026-10-24T22:00:00.000Z'),
        day('2026-10-25T23:00:00.000Z'),
      ],
      [],
    )

    expect(Option.map(stored, ({ currentStreak }) => currentStreak)).toEqual(Option.some(3))
  })
})

describe('the streak shown today', () => {
  const now = at('2026-11-13T12:00:00.000Z')

  it('is empty for an account without a qualifying day', () => {
    expect(streakOf(Option.none(), answers(3), now, bridges(0))).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      todayAnswerCount: 3,
      dailyAnswerThreshold: 5,
      todayQualifies: false,
      bridgeCount: 0,
      bridgeLimit: 5,
      pendingBridgeCount: 0,
    })
  })

  it('includes today once today qualifies', () => {
    expect(
      streakOf(Option.some(record(4, 6, '2026-11-12T23:00:00.000Z')), answers(5), now, bridges(0)),
    ).toMatchObject({ currentStreak: 4, longestStreak: 6, todayQualifies: true })
  })

  it("keeps yesterday's streak while today can still qualify", () => {
    expect(
      streakOf(Option.some(record(4, 6, '2026-11-11T23:00:00.000Z')), answers(2), now, bridges(0)),
    ).toMatchObject({ currentStreak: 4, longestStreak: 6, todayQualifies: false })
  })

  it('is broken after a day without qualifying activity while the longest is kept', () => {
    expect(
      streakOf(Option.some(record(4, 6, '2026-11-10T23:00:00.000Z')), answers(0), now, bridges(0)),
    ).toMatchObject({ currentStreak: 0, longestStreak: 6, todayQualifies: false })
  })

  it('follows the Europe/Warsaw day just after midnight', () => {
    const justAfterMidnight = at('2026-11-13T23:30:00.000Z')

    expect(
      streakOf(
        Option.some(record(4, 6, '2026-11-12T23:00:00.000Z')),
        answers(0),
        justAfterMidnight,
        bridges(0),
      ),
    ).toMatchObject({ currentStreak: 4, todayQualifies: false })
  })
})

describe('a streak bridge', () => {
  it('keeps the streak across a bridged day without lengthening it', () => {
    const stored = streakRecordOf(
      [
        day('2026-11-09T23:00:00.000Z'),
        day('2026-11-10T23:00:00.000Z'),
        day('2026-11-12T23:00:00.000Z'),
      ],
      [day('2026-11-11T23:00:00.000Z')],
    )

    expect(
      Option.map(stored, ({ currentStreak, longestStreak }) => ({ currentStreak, longestStreak })),
    ).toEqual(Option.some({ currentStreak: 3, longestStreak: 3 }))
  })

  it('covers every missed day of a gap only when enough bridges are held', () => {
    const lastQualifyingDay = day('2026-11-09T23:00:00.000Z')
    const returnDay = day('2026-11-12T23:00:00.000Z')

    expect(
      Option.map(coveredMissedDays(lastQualifyingDay, returnDay, bridges(2)), days =>
        days.map(iso),
      ),
    ).toEqual(Option.some(['2026-11-10T23:00:00.000Z', '2026-11-11T23:00:00.000Z']))
    expect(coveredMissedDays(lastQualifyingDay, returnDay, bridges(1))).toEqual(Option.none())
    expect(coveredMissedDays(day('2026-11-11T23:00:00.000Z'), returnDay, bridges(0))).toEqual(
      Option.some([]),
    )
  })

  it('is earned when the streak reaches a multiple of seven on that day', () => {
    const today = day('2026-11-12T23:00:00.000Z')

    expect(reachesStreakMilestone(record(7, 7, '2026-11-12T23:00:00.000Z'), today)).toBe(true)
    expect(reachesStreakMilestone(record(14, 20, '2026-11-12T23:00:00.000Z'), today)).toBe(true)
    expect(reachesStreakMilestone(record(8, 8, '2026-11-12T23:00:00.000Z'), today)).toBe(false)
    expect(reachesStreakMilestone(record(7, 7, '2026-11-13T23:00:00.000Z'), today)).toBe(false)
  })

  it('is granted only up to the limit of five', () => {
    expect(grantedBridges(bridges(4), bridges(1))).toBe(1)
    expect(grantedBridges(bridges(5), bridges(1))).toBe(0)
    expect(grantedBridges(bridges(2), bridges(5))).toBe(3)
  })

  describe('in the streak shown today', () => {
    const now = at('2026-11-13T12:00:00.000Z')

    it('protects a streak whose missed days the held bridges cover', () => {
      expect(
        streakOf(
          Option.some(record(4, 6, '2026-11-10T23:00:00.000Z')),
          answers(0),
          now,
          bridges(1),
        ),
      ).toMatchObject({ currentStreak: 4, bridgeCount: 1, pendingBridgeCount: 1 })
    })

    it('breaks a streak whose gap is longer than the held bridges', () => {
      expect(
        streakOf(
          Option.some(record(4, 6, '2026-11-09T23:00:00.000Z')),
          answers(0),
          now,
          bridges(1),
        ),
      ).toMatchObject({ currentStreak: 0, longestStreak: 6, bridgeCount: 1, pendingBridgeCount: 0 })
    })
  })
})
