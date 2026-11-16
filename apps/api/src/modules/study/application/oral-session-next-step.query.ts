import type { UserId } from '@inzpro/domain/modules/identity/user'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { OralStudySessionId } from '@inzpro/domain/modules/study/oral-study-session'
import {
  continueStudyNextStep,
  startStudyNextStep,
} from '@inzpro/domain/modules/study/study-session'
import { Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import type { OralSessionNextStep } from '~api/modules/study/domain/oral-session-next-step.model.js'

import { getOralSessionPreview } from './oral-session-preview.query.js'
import { OralStudyReader } from './oral-study.reader.js'

// TODO(#61): offer oral reviews; until then the step continues or starts oral study.
export const getOralSessionNextStep = Effect.fn('Study.getOralSessionNextStep')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: OralStudySessionId,
) {
  yield* requirePathAccess(userId, pathId, oralExamAccess)
  const oralStudyReader = yield* OralStudyReader
  const session = yield* oralStudyReader.session(userId, pathId, sessionId)

  if (Option.isNone(session)) {
    return Option.none<OralSessionNextStep>()
  }

  const unfinished = yield* oralStudyReader.latestUnfinishedSession(userId, pathId)

  if (Option.isSome(unfinished)) {
    return Option.some<OralSessionNextStep>({
      type: continueStudyNextStep,
      session: unfinished.value,
    })
  }

  const preview = yield* getOralSessionPreview(
    userId,
    pathId,
    Option.none(),
    Option.some(session.value.categoryId),
  )

  return Option.map(preview, (next): OralSessionNextStep => ({
    type: startStudyNextStep,
    preview: next,
  }))
})
