import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import { StreakLength } from '@inzpro/domain/modules/streak/streak'
import { expect, test } from 'vitest'
import { LearningRoundNumber } from '~api/modules/learning/domain/learning-round.model.js'

import { LearningAchievement } from './learning-reward.model.js'
import { achievementBadges, totalXpBadges } from './learning-reward.rules.js'

test.each([
  { length: 6, expected: [] },
  { length: 7, expected: ['streak_7'] },
  { length: 30, expected: ['streak_7', 'streak_30'] },
  { length: 100, expected: ['streak_7', 'streak_30', 'streak_100'] },
])('a streak of $length days reaches $expected', ({ length, expected }) => {
  expect(
    achievementBadges(LearningAchievement.StreakReached({ length: StreakLength.make(length) })),
  ).toEqual(expected)
})

test.each([
  { part: 'written', expected: ['first_written_round'] },
  { part: 'oral', expected: ['first_oral_round'] },
] as const)('a completed $part round earns $expected', ({ part, expected }) => {
  expect(
    achievementBadges(
      LearningAchievement.CompletedRound({ part, round: LearningRoundNumber.make(2) }),
    ),
  ).toEqual(expected)
})

test('a finished session and a passed mock exam earn their first-time badges', () => {
  expect(achievementBadges(LearningAchievement.FinishedSession())).toEqual([
    'first_finished_session',
  ])
  expect(achievementBadges(LearningAchievement.PassedMockExam())).toEqual([
    'first_passed_mock_exam',
  ])
})

test.each([
  { total: 999, expected: [] },
  { total: 1000, expected: ['xp_1000'] },
  { total: 10_000, expected: ['xp_1000', 'xp_10000'] },
])('a total of $total XP reaches $expected', ({ total, expected }) => {
  expect(totalXpBadges(LearningXp.make(total))).toEqual(expected)
})
