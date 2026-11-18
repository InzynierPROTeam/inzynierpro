import type { UserId } from '@inzpro/domain/modules/identity/user'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Effect, Option } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import { dailyPlanOf } from '~api/modules/daily-plan/domain/daily-plan.rules.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import { prepareDailyPlan } from '~api/modules/written-study/application/daily-plan.service.js'
import { StudyReader } from '~api/modules/written-study/application/study.reader.js'

export const openDailyPlan = Effect.fn('Study.openDailyPlan')(function* (
  userId: UserId,
  pathId: QualificationPathId,
) {
  const preparationRepository = yield* PreparationRepository
  const studyReader = yield* StudyReader
  const transaction = yield* Transaction

  return yield* transaction.run(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      const { goal } = yield* requirePathAccess(userId, pathId, { part: writtenExamAccess })
      const now = yield* DateTime.now
      const progress = yield* studyReader.learningRound(userId, pathId)
      const record = yield* prepareDailyPlan(userId, pathId, goal.writtenAt, progress, now)

      const roundStart = yield* Effect.transposeOption(
        Option.map(record, ({ round }) => studyReader.firstDailyPlanOfRound(userId, pathId, round)),
      )

      return dailyPlanOf({
        now,
        examAt: goal.writtenAt,
        record,
        roundStart: Option.flatten(roundStart),
      })
    }),
  )
})
