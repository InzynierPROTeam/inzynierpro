import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import { DateTime, Effect } from 'effect'

import type { DailyXpAwardLimit, XpAward } from '../domain/learning-xp.model.js'
import { xpPeriodsOf } from '../domain/learning-xp.rules.js'
import { XpRepository } from './learning-xp.repository.js'

export const awardXp = Effect.fn('LearningXp.awardXp')(function* (
  award: XpAward,
  dailyLimit?: DailyXpAwardLimit,
) {
  const xpRepository = yield* XpRepository

  if (!(yield* xpRepository.recordAward(award, dailyLimit))) {
    return LearningXp.make(0)
  }

  const reachedAt = yield* DateTime.now

  for (const period of xpPeriodsOf(award)) {
    yield* xpRepository.addPeriodXp(award, period, reachedAt)
  }

  return award.amount
})
