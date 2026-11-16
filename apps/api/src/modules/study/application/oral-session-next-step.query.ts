import type { UserId } from '@inzpro/domain/modules/identity/user'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { OralStudySessionId } from '@inzpro/domain/modules/study/oral-study-session'
import {
  favoritesStudySession,
  regularStudySession,
  reviewNextStep,
  reviewStudySession,
  continueStudyNextStep,
  startStudyNextStep,
} from '@inzpro/domain/modules/study/study-session'
import { Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { wholePathFilter } from '~api/modules/study/domain/oral-question-scope.rules.js'
import { defaultOralReviewQuestionCount } from '~api/modules/study/domain/oral-review-session.rules.js'
import type { OralSessionNextStep } from '~api/modules/study/domain/oral-session-next-step.model.js'

import { findOralReviewPreview } from './oral-review-preview.query.js'
import { findOralSessionPreview } from './oral-session-preview.query.js'
import { OralStudyReader } from './oral-study.reader.js'

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

  const scopes =
    session.value.kind === reviewStudySession && Option.isSome(session.value.categoryId)
      ? [session.value.categoryId, Option.none()]
      : [Option.none()]

  for (const scope of scopes) {
    const review = yield* findOralReviewPreview(userId, pathId, scope, wholePathFilter)

    if (
      session.value.kind !== favoritesStudySession &&
      Option.isSome(review) &&
      (session.value.kind === reviewStudySession
        ? review.value.queue.dueCount > 0
        : review.value.queue.dueCount >= defaultOralReviewQuestionCount)
    ) {
      return Option.some<OralSessionNextStep>({
        type: reviewNextStep,
        category: Option.map(review.value.category, ({ id, name }) => ({ id, name })),
        dueQuestionCount: review.value.queue.dueCount,
      })
    }
  }

  const unfinished = yield* oralStudyReader.latestUnfinishedSession(userId, pathId)

  if (Option.isSome(unfinished)) {
    return Option.some<OralSessionNextStep>({
      type: continueStudyNextStep,
      session: unfinished.value,
    })
  }

  const fromCategoryId =
    session.value.kind === regularStudySession
      ? session.value.categoryId
      : Option.flatMap(
          yield* oralStudyReader.latestSession(userId, pathId, Option.none()),
          latest => latest.categoryId,
        )

  const preview = yield* findOralSessionPreview(
    userId,
    pathId,
    Option.none(),
    fromCategoryId,
    wholePathFilter,
  )

  return Option.map(preview, (next): OralSessionNextStep => ({
    type: startStudyNextStep,
    preview: next,
  }))
})
