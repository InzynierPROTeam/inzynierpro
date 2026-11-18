import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import { expect, test } from 'vitest'

import { learningRewardToasts } from './rewards'

test('a round reward and each new badge get their own toast', () => {
  expect(
    learningRewardToasts({
      roundReward: { part: 'oral', xp: LearningXp.make(1000) },
      badges: [
        { code: 'first_oral_round', xp: LearningXp.make(100) },
        { code: 'xp_1000', xp: LearningXp.make(100) },
      ],
    }),
  ).toEqual([
    { type: 'success', title: 'Ukończono rundę nauki ustnej!', description: '+1000 XP' },
    {
      type: 'success',
      title: 'Nowa odznaka: Pierwsza runda nauki ustnej',
      description: '+100 XP',
    },
    { type: 'success', title: 'Nowa odznaka: 1000 punktów za naukę', description: '+100 XP' },
  ])
})

test('a response without rewards shows nothing', () => {
  expect(learningRewardToasts({ roundReward: null, badges: [] })).toEqual([])
})
