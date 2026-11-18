import type { UserId } from '@inzpro/domain/modules/identity/user'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Effect, Option } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import { dailyPlanOf } from '~api/modules/daily-plan/domain/daily-plan.rules.js'
import { prepareOralDailyPlan } from '~api/modules/oral-study/application/oral-daily-plan.service.js'
import { OralStudyReader } from '~api/modules/oral-study/application/oral-study.reader.js'
import { oralExamAt } from '~api/modules/oral-study/domain/oral-exam-day.rules.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'

export const openOralDailyPlan = Effect.fn('Study.openOralDailyPlan')(function* (
  userId: UserId,
  pathId: QualificationPathId,
) {
  const preparationRepository = yield* PreparationRepository
  const oralStudyReader = yield* OralStudyReader
  const transaction = yield* Transaction

  return yield* transaction.run(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      const { goal } = yield* requirePathAccess(userId, pathId, { part: oralExamAccess })
      const now = yield* DateTime.now
      const progress = yield* oralStudyReader.learningRound(userId, pathId)
      const record = yield* prepareOralDailyPlan(userId, pathId, oralExamAt(goal), progress, now)

      const roundStart = yield* Effect.transposeOption(
        Option.map(record, ({ round }) =>
          oralStudyReader.firstDailyPlanOfRound(userId, pathId, round),
        ),
      )

      return dailyPlanOf({
        now,
        examAt: oralExamAt(goal),
        record,
        roundStart: Option.flatten(roundStart),
      })
    }),
  )
})
