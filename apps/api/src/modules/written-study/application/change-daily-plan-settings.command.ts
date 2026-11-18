import type { UserId } from '@inzpro/domain/modules/identity/user'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Effect, Option } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import type { DailyPlanSettingsChange } from '~api/modules/daily-plan/domain/daily-plan.model.js'
import {
  changedDailyPlanSettings,
  replanDailyPlan,
} from '~api/modules/daily-plan/domain/daily-plan.rules.js'
import { studyDayOf } from '~api/modules/learning/domain/study-day.rules.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import { currentDailyPlan } from '~api/modules/written-study/application/daily-plan.service.js'
import { StudyReader } from '~api/modules/written-study/application/study.reader.js'
import { StudyRepository } from '~api/modules/written-study/application/study.repository.js'

export const changeDailyPlanSettings = Effect.fn('Study.changeDailyPlanSettings')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  change: DailyPlanSettingsChange,
) {
  const preparationRepository = yield* PreparationRepository
  const studyReader = yield* StudyReader
  const studyRepository = yield* StudyRepository
  const transaction = yield* Transaction

  return yield* transaction.run(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      const { goal } = yield* requirePathAccess(userId, pathId, { part: writtenExamAccess })
      const examAt = goal.writtenAt
      const now = yield* DateTime.now

      const changed = yield* changedDailyPlanSettings({
        now,
        examAt,
        current: yield* studyReader.dailyPlanSettings(userId, pathId),
        ...change,
      })

      if (Option.isSome(changed)) {
        const settings = changed.value
        yield* studyRepository.appendDailyPlanSettings(userId, pathId, settings)

        const today = yield* studyReader.dailyPlan(userId, pathId, studyDayOf(now).start)

        if (Option.isSome(today)) {
          yield* studyRepository.replanDailyPlan(
            userId,
            pathId,
            replanDailyPlan({ now, examAt, record: today.value, settings }),
          )
        }
      }

      return yield* currentDailyPlan(userId, pathId, examAt, now)
    }),
  )
})
