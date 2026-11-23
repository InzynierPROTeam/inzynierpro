import { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Effect, Schema } from 'effect'
import { ExamCalendarRepository } from '~api/modules/exam-calendar/application/exam-calendar.repository.js'
import { CalendarSession } from '~api/modules/exam-calendar/domain/exam-session.model.js'
import { awardXp } from '~api/modules/learning-xp/application/award-xp.service.js'
import { writtenAnswerXpReason } from '~api/modules/learning-xp/domain/learning-xp.model.js'
import { fixedWallClockLayer } from '~api/test/clock.js'
import { technicalPathA } from '~api/test/preparation.js'
import { runFixture } from '~api/test/run-fixture.js'

export const createFixtureExamSession = () =>
  runFixture(
    Effect.gen(function* () {
      const examCalendarRepository = yield* ExamCalendarRepository

      const session = yield* Schema.decodeEffect(CalendarSession)({
        id: crypto.randomUUID(),
        generalChamberId: '50000000-0000-4000-8000-000000000001',
        name: 'Test-only ranking session',
        writtenAt: '2026-01-10T08:00:00.000Z',
        oralPlanningAt: '2026-01-20T08:00:00.000Z',
        selectionClosesAt: '2026-01-20T08:00:00.000Z',
        isConfirmed: true,
      })

      yield* examCalendarRepository.create(session)

      return session.id
    }),
  )

export type FixtureXpAward = {
  readonly userId: UserId
  readonly examSessionId: string
  readonly amount: number
  readonly awardedAt: string
}

const fixtureAward = ({ userId, examSessionId, amount, awardedAt }: FixtureXpAward) =>
  Effect.gen(function* () {
    return yield* awardXp({
      reason: writtenAnswerXpReason,
      userId,
      pathId: yield* Schema.decodeEffect(QualificationPathId)(technicalPathA),
      examSessionId: yield* Schema.decodeEffect(ExamSessionId)(examSessionId),
      amount: LearningXp.make(amount),
      awardKey: `fixture:${crypto.randomUUID()}`,
      awardedAt: DateTime.makeUnsafe(awardedAt),
    })
  }).pipe(Effect.provide(fixedWallClockLayer(DateTime.makeUnsafe(awardedAt))))

export const awardFixtureXp = (awards: ReadonlyArray<FixtureXpAward>) =>
  runFixture(Effect.forEach(awards, fixtureAward))
