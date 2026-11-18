import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { type DateTime, Effect, Option } from 'effect'
import {
  closesPlannedRound,
  draftDailyPlan,
  isCountedPlanAnswer,
  type RoundCoverage,
} from '~api/modules/daily-plan/domain/daily-plan.rules.js'
import type { LearningRoundProgress } from '~api/modules/learning/domain/learning-round.model.js'
import { studyDayOf } from '~api/modules/learning/domain/study-day.rules.js'
import { OralStudyReader } from '~api/modules/oral-study/application/oral-study.reader.js'
import { OralStudyRepository } from '~api/modules/oral-study/application/oral-study.repository.js'

export const prepareOralDailyPlan = Effect.fn('Study.prepareOralDailyPlan')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  examAt: DateTime.Utc,
  progress: LearningRoundProgress,
  now: DateTime.Utc,
) {
  const oralStudyReader = yield* OralStudyReader
  const oralStudyRepository = yield* OralStudyRepository
  const studyDay = studyDayOf(now).start
  const frozen = yield* oralStudyReader.dailyPlan(userId, pathId, studyDay)
  const draft = draftDailyPlan({ now, examAt, progress })

  if (Option.isSome(frozen) || Option.isNone(draft)) {
    return frozen
  }

  yield* oralStudyRepository.createDailyPlan(userId, pathId, draft.value)

  return yield* oralStudyReader.dailyPlan(userId, pathId, studyDay)
})

export const recordOralDailyPlanAnswer = Effect.fn('Study.recordOralDailyPlanAnswer')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  now: DateTime.Utc,
  coverage: RoundCoverage,
) {
  const oralStudyRepository = yield* OralStudyRepository
  const studyDay = studyDayOf(now).start

  if (isCountedPlanAnswer(coverage)) {
    yield* oralStudyRepository.countDailyPlanAnswer(userId, pathId, studyDay)
  }

  if (closesPlannedRound(coverage)) {
    yield* oralStudyRepository.completeDailyPlanRound(userId, pathId, studyDay)
  }
})
