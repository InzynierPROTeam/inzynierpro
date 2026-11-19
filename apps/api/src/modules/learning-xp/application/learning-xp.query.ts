import type { UserId } from '@inzpro/domain/modules/identity/user'
import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import { Effect, Option } from 'effect'

import { allTimeXpPeriod } from '../domain/learning-xp.model.js'
import { XpReader } from './learning-xp.reader.js'

export const accountLearningXp = Effect.fn('LearningXp.accountLearningXp')(function* (
  userId: UserId,
) {
  const xpReader = yield* XpReader

  const total = yield* xpReader.periodTotal(userId, allTimeXpPeriod)
  const badges = yield* xpReader.earnedBadges(userId)

  return {
    total: Option.match(total, {
      onNone: () => LearningXp.make(0),
      onSome: value => value.total,
    }),
    badges,
  }
})
