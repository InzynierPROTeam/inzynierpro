import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { type DateTime, Effect, Option } from 'effect'
import {
  closesPlannedRound,
  dailyPlanOf,
  draftDailyPlan,
  isCountedPlanAnswer,
  type RoundCoverage,
} from '~api/modules/daily-plan/domain/daily-plan.rules.js'
import type { LearningRoundProgress } from '~api/modules/learning/domain/learning-round.model.js'
import { studyDayOf } from '~api/modules/learning/domain/study-day.rules.js'
import { StudyReader } from '~api/modules/written-study/application/study.reader.js'
import { StudyRepository } from '~api/modules/written-study/application/study.repository.js'

export const prepareDailyPlan = Effect.fn('Study.prepareDailyPlan')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  examAt: DateTime.Utc,
  progress: LearningRoundProgress,
  now: DateTime.Utc,
) {
  const studyReader = yield* StudyReader
  const studyRepository = yield* StudyRepository
  const studyDay = studyDayOf(now).start
  const frozen = yield* studyReader.dailyPlan(userId, pathId, studyDay)
  const settings = yield* studyReader.dailyPlanSettings(userId, pathId)
  const draft = draftDailyPlan({ now, examAt, progress, settings })

  if (Option.isSome(frozen) || Option.isNone(draft)) {
    return frozen
  }

  yield* studyRepository.createDailyPlan(userId, pathId, draft.value)

  return yield* studyReader.dailyPlan(userId, pathId, studyDay)
})

export const recordDailyPlanAnswer = Effect.fn('Study.recordDailyPlanAnswer')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  now: DateTime.Utc,
  coverage: RoundCoverage,
) {
  const studyRepository = yield* StudyRepository
  const studyDay = studyDayOf(now).start

  if (isCountedPlanAnswer(coverage)) {
    yield* studyRepository.countDailyPlanAnswer(userId, pathId, studyDay)
  }

  if (closesPlannedRound(coverage)) {
    yield* studyRepository.completeDailyPlanRound(userId, pathId, studyDay)
  }
})

export const currentDailyPlan = Effect.fn('Study.currentDailyPlan')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  examAt: DateTime.Utc,
  now: DateTime.Utc,
) {
  const studyReader = yield* StudyReader
  const progress = yield* studyReader.learningRound(userId, pathId)
  const record = yield* prepareDailyPlan(userId, pathId, examAt, progress, now)
  const settings = yield* studyReader.dailyPlanSettings(userId, pathId)

  const paceStart = yield* Effect.transposeOption(
    Option.map(record, ({ round, settingsVersion }) =>
      studyReader.firstDailyPlanOfPace(userId, pathId, round, settingsVersion),
    ),
  )

  return dailyPlanOf({ now, examAt, record, paceStart: Option.flatten(paceStart), settings })
})
