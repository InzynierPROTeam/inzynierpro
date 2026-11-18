import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import { Effect } from 'effect'

import type { XpAward } from '../domain/learning-xp.model.js'
import { xpPeriodsOf } from '../domain/learning-xp.rules.js'
import { XpRepository } from './learning-xp.repository.js'

export const awardXp = Effect.fn('LearningXp.awardXp')(function* (award: XpAward) {
  const xpRepository = yield* XpRepository

  if (!(yield* xpRepository.recordAward(award))) {
    return LearningXp.make(0)
  }

  for (const period of xpPeriodsOf(award)) {
    yield* xpRepository.addPeriodXp(award, period)
  }

  return award.amount
})
