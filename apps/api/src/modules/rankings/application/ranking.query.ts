import type { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { RankingPeriod } from '@inzpro/domain/modules/rankings/ranking'
import { DateTime, Effect, Option } from 'effect'
import type { XpPeriod } from '~api/modules/learning-xp/domain/learning-xp.model.js'
import { examSessionXpPeriodOf } from '~api/modules/learning-xp/domain/learning-xp.rules.js'
import { canViewProfile } from '~api/modules/profiles/domain/profile.rules.js'

import type { RankedUser, Ranking } from '../domain/ranking.model.js'
import { rankingXpPeriod } from '../domain/ranking.rules.js'
import { RankingReader } from './ranking.reader.js'

const rankingOf = Effect.fn('Rankings.rankingOf')(function* (viewerId: UserId, period: XpPeriod) {
  const rankingReader = yield* RankingReader
  const top = yield* rankingReader.top(period)
  const viewer = yield* rankingReader.rankedUser(viewerId, period)

  const visibleTo = (user: RankedUser) => ({
    ...user,
    profileVisible: canViewProfile(viewerId, user),
  })

  return { entries: top.map(visibleTo), viewer: Option.map(viewer, visibleTo) } satisfies Ranking
})

export const periodRanking = Effect.fn('Rankings.periodRanking')(function* (
  viewerId: UserId,
  period: RankingPeriod,
) {
  const now = yield* DateTime.now

  return yield* rankingOf(viewerId, rankingXpPeriod(period, now))
})

export const examSessionRanking = Effect.fn('Rankings.examSessionRanking')(function* (
  viewerId: UserId,
  examSessionId: ExamSessionId,
) {
  return yield* rankingOf(viewerId, examSessionXpPeriodOf(examSessionId))
})
