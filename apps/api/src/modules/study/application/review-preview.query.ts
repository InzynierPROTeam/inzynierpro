import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import type { ReviewPreview } from '~api/modules/study/domain/review-session.model.js'
import { reviewSessionSettings } from '~api/modules/study/domain/review-session.rules.js'

import { StudyReader } from './study.reader.js'

export const getReviewPreview = Effect.fn('Study.getReviewPreview')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  documentId: Option.Option<ReferenceDocumentId>,
) {
  yield* requirePathAccess(userId, pathId, writtenExamAccess)
  const studyReader = yield* StudyReader

  const document = yield* Effect.transposeOption(
    Option.map(documentId, id => studyReader.pathDocument(pathId, id)),
  )

  if (Option.isSome(document) && Option.isNone(document.value)) {
    return Option.none()
  }

  const queue = yield* studyReader.reviewQueue(userId, pathId, documentId, yield* DateTime.now)

  return Option.some<ReviewPreview>({
    qualificationPathId: pathId,
    document: Option.flatten(document),
    queue,
    settings: reviewSessionSettings(queue.dueCount),
  })
})
