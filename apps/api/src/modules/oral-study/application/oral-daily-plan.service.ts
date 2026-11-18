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
  const settings = yield* oralStudyReader.dailyPlanSettings(userId, pathId)
  const draft = draftDailyPlan({ now, examAt, progress, settings })

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

export const currentOralDailyPlan = Effect.fn('Study.currentOralDailyPlan')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  examAt: DateTime.Utc,
  now: DateTime.Utc,
) {
  const oralStudyReader = yield* OralStudyReader
  const progress = yield* oralStudyReader.learningRound(userId, pathId)
  const record = yield* prepareOralDailyPlan(userId, pathId, examAt, progress, now)
  const settings = yield* oralStudyReader.dailyPlanSettings(userId, pathId)

  const paceStart = yield* Effect.transposeOption(
    Option.map(record, ({ round, settingsVersion }) =>
      oralStudyReader.firstDailyPlanOfPace(userId, pathId, round, settingsVersion),
    ),
  )

  return dailyPlanOf({ now, examAt, record, paceStart: Option.flatten(paceStart), settings })
})
