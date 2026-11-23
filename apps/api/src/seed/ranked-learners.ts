import { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { UserId } from '@inzpro/domain/modules/identity/user'
import {
  type BadgeCode,
  firstFinishedSessionBadge,
  firstPassedMockExamBadge,
} from '@inzpro/domain/modules/learning-xp/badge'
import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Effect, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import {
  badgeAwardOf,
  totalXpBadges,
} from '~api/modules/learning-xp/domain/learning-reward.rules.js'
import {
  type BadgeXpAward,
  writtenAnswerXpReason,
  type XpAward,
} from '~api/modules/learning-xp/domain/learning-xp.model.js'
import { xpPeriodsOf } from '~api/modules/learning-xp/domain/learning-xp.rules.js'

import { catalogueId } from './catalogue-id.js'

const rankedPath = Schema.decodeSync(QualificationPathId)(catalogueId('10', 1))

const springSession = Schema.decodeSync(ExamSessionId)(catalogueId('90', 1))

const autumnSession = Schema.decodeSync(ExamSessionId)(catalogueId('90', 3))

export type DailyXp = readonly [daysAgo: number, xp: number]

export type SeededXp = {
  readonly userId: UserId
  readonly pathId: QualificationPathId
  readonly examSessionId: ExamSessionId
  readonly dailyXp: ReadonlyArray<DailyXp>
  readonly badges: ReadonlyArray<BadgeCode>
}

const rankedLearners = [
  {
    email: 'ranking-anna@example.com',
    name: 'Anna Nowak',
    privateProfile: false,
    examSessionId: springSession,
    dailyXp: [
      [0, 60],
      [1, 140],
      [2, 90],
      [5, 120],
      [9, 80],
      [16, 150],
      [34, 200],
      [41, 120],
    ],
    badges: [firstFinishedSessionBadge, firstPassedMockExamBadge],
  },
  {
    email: 'ranking-piotr@example.com',
    name: 'Piotr Wiśniewski',
    privateProfile: false,
    examSessionId: springSession,
    dailyXp: [
      [0, 110],
      [1, 70],
      [3, 130],
      [8, 60],
      [12, 90],
      [33, 180],
    ],
    badges: [firstFinishedSessionBadge],
  },
  {
    email: 'ranking-katarzyna@example.com',
    name: 'Katarzyna Wójcik',
    privateProfile: false,
    examSessionId: autumnSession,
    dailyXp: [
      [1, 50],
      [2, 40],
      [6, 160],
      [10, 140],
      [15, 120],
      [36, 90],
    ],
    badges: [firstFinishedSessionBadge],
  },
  {
    email: 'ranking-tomasz@example.com',
    name: 'Tomasz Kamiński',
    privateProfile: true,
    examSessionId: springSession,
    dailyXp: [
      [0, 80],
      [2, 120],
      [4, 70],
      [11, 100],
      [38, 60],
    ],
    badges: [firstFinishedSessionBadge, firstPassedMockExamBadge],
  },
  {
    email: 'ranking-magdalena@example.com',
    name: 'Magdalena Lewandowska',
    privateProfile: false,
    examSessionId: autumnSession,
    dailyXp: [
      [3, 30],
      [7, 90],
      [14, 60],
      [31, 240],
      [45, 150],
    ],
    badges: [firstFinishedSessionBadge],
  },
] as const

const LearnerRow = Schema.Tuple([Schema.Struct({ id: UserId })])

const recordSeededAward = (award: XpAward, badgeCode: BadgeCode | null) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const awardedAt = DateTime.formatIso(award.awardedAt)

    const recorded =
      yield* sql`INSERT INTO xp_events (user_id,amount,reason,badge_code,award_key,awarded_at,qualification_path_id,exam_session_id)
 VALUES (${award.userId},${award.amount},${award.reason},${badgeCode},${award.awardKey},${awardedAt},${award.pathId},${award.examSessionId})
 ON CONFLICT (user_id,award_key) DO NOTHING RETURNING award_key`

    if (recorded.length === 0) {
      return
    }

    for (const period of xpPeriodsOf(award)) {
      yield* sql`INSERT INTO user_period_xp (user_id,period_kind,period_key,total,reached_at)
 VALUES (${award.userId},${period.kind},${period.key},${award.amount},${awardedAt})
 ON CONFLICT (user_id,period_kind,period_key) DO UPDATE SET total=user_period_xp.total+EXCLUDED.total,reached_at=greatest(user_period_xp.reached_at,EXCLUDED.reached_at)`
    }
  })

export const seedLearnerXp = (now: DateTime.Utc, learner: SeededXp) =>
  Effect.gen(function* () {
    const trigger = {
      userId: learner.userId,
      pathId: learner.pathId,
      examSessionId: learner.examSessionId,
    }

    for (const [daysAgo, xp] of [...learner.dailyXp].sort(([a], [b]) => b - a)) {
      yield* recordSeededAward(
        {
          ...trigger,
          reason: writtenAnswerXpReason,
          amount: LearningXp.make(xp),
          awardKey: `seed:written:${daysAgo}`,
          awardedAt: DateTime.subtract(now, { days: daysAgo }),
        },
        null,
      )
    }

    const badgeOf = (code: BadgeCode) => badgeAwardOf({ ...trigger, at: now }, code)
    const badgeAwards: Array<BadgeXpAward> = learner.badges.map(badgeOf)

    const totalXp = () =>
      learner.dailyXp.reduce((sum, [, xp]) => sum + xp, 0) +
      badgeAwards.reduce((sum, award) => sum + award.amount, 0)

    let reached = totalXpBadges(LearningXp.make(totalXp()))

    while (reached.some(code => !badgeAwards.some(award => award.badgeCode === code))) {
      for (const code of reached) {
        if (!badgeAwards.some(award => award.badgeCode === code)) {
          badgeAwards.push(badgeOf(code))
        }
      }

      reached = totalXpBadges(LearningXp.make(totalXp()))
    }

    for (const award of badgeAwards) {
      yield* recordSeededAward(award, award.badgeCode)
    }
  })

export const seedRankedLearners = Effect.fn('Seed.seedRankedLearners')(function* () {
  const sql = yield* SqlClient.SqlClient
  const now = yield* DateTime.now

  for (const learner of rankedLearners) {
    yield* sql`INSERT INTO users (name,email,email_verified,private_profile) VALUES (${learner.name},${learner.email},true,${learner.privateProfile}) ON CONFLICT (email) DO NOTHING`

    const [{ id: userId }] =
      yield* sql`SELECT id FROM users WHERE email=${learner.email} LIMIT 1`.pipe(
        Effect.flatMap(Schema.decodeUnknownEffect(LearnerRow)),
      )

    yield* sql`INSERT INTO user_qualification_paths (user_id,qualification_path_id,access_scope) VALUES (${userId},${rankedPath},'written') ON CONFLICT DO NOTHING`
    yield* sql`INSERT INTO user_exam_goals (user_id,qualification_path_id,version,exam_session_id,access_scope) VALUES (${userId},${rankedPath},1,${learner.examSessionId},'written') ON CONFLICT DO NOTHING`

    yield* seedLearnerXp(now, {
      userId,
      pathId: rankedPath,
      examSessionId: learner.examSessionId,
      dailyXp: learner.dailyXp,
      badges: learner.badges,
    })
  }
})
