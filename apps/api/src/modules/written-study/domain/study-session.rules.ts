import { Effect, Random } from 'effect'
import type { SessionCandidate } from '~api/modules/written-study/domain/study-session.model.js'

export const shuffleAnswerOrders = (candidates: ReadonlyArray<SessionCandidate>) =>
  Effect.forEach(candidates, candidate =>
    Effect.map(Random.shuffle(candidate.answerIds), answerIds => ({ ...candidate, answerIds })),
  )
