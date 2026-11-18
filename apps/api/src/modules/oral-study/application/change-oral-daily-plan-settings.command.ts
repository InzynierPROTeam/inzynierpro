import type { UserId } from '@inzpro/domain/modules/identity/user'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Effect, Option } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import type { DailyPlanSettingsChange } from '~api/modules/daily-plan/domain/daily-plan.model.js'
import {
  changedDailyPlanSettings,
  replanDailyPlan,
} from '~api/modules/daily-plan/domain/daily-plan.rules.js'
import { studyDayOf } from '~api/modules/learning/domain/study-day.rules.js'
import { currentOralDailyPlan } from '~api/modules/oral-study/application/oral-daily-plan.service.js'
import { OralStudyReader } from '~api/modules/oral-study/application/oral-study.reader.js'
import { OralStudyRepository } from '~api/modules/oral-study/application/oral-study.repository.js'
import { oralExamAt } from '~api/modules/oral-study/domain/oral-exam-day.rules.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'

export const changeOralDailyPlanSettings = Effect.fn('Study.changeOralDailyPlanSettings')(
  function* (userId: UserId, pathId: QualificationPathId, change: DailyPlanSettingsChange) {
    const preparationRepository = yield* PreparationRepository
    const oralStudyReader = yield* OralStudyReader
    const oralStudyRepository = yield* OralStudyRepository
    const transaction = yield* Transaction

    return yield* transaction.run(
      Effect.gen(function* () {
        yield* preparationRepository.lockUser(userId)
        const { goal } = yield* requirePathAccess(userId, pathId, { part: oralExamAccess })
        const examAt = oralExamAt(goal)
        const now = yield* DateTime.now

        const changed = yield* changedDailyPlanSettings({
          now,
          examAt,
          current: yield* oralStudyReader.dailyPlanSettings(userId, pathId),
          ...change,
        })

        if (Option.isSome(changed)) {
          const settings = changed.value
          yield* oralStudyRepository.appendDailyPlanSettings(userId, pathId, settings)

          const today = yield* oralStudyReader.dailyPlan(userId, pathId, studyDayOf(now).start)

          if (Option.isSome(today)) {
            yield* oralStudyRepository.replanDailyPlan(
              userId,
              pathId,
              replanDailyPlan({ now, examAt, record: today.value, settings }),
            )
          }
        }

        return yield* currentOralDailyPlan(userId, pathId, examAt, now)
      }),
    )
  },
)
