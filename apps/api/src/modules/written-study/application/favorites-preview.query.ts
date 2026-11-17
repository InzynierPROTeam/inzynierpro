import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { StudyReader } from '~api/modules/written-study/application/study.reader.js'
import type { FavoritesPreview } from '~api/modules/written-study/domain/favorites-session.model.js'
import { favoritesSessionSettings } from '~api/modules/written-study/domain/favorites-session.rules.js'

export const getFavoritesPreview = Effect.fn('Study.getFavoritesPreview')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  documentId: Option.Option<ReferenceDocumentId>,
) {
  yield* requirePathAccess(userId, pathId, { part: writtenExamAccess })
  const studyReader = yield* StudyReader

  const document = yield* Effect.transposeOption(
    Option.map(documentId, id => studyReader.pathDocument(pathId, id)),
  )

  if (Option.isSome(document) && Option.isNone(document.value)) {
    return Option.none()
  }

  const favoriteQuestionCount = yield* studyReader.favoriteQuestionCount(userId, pathId, documentId)

  return Option.some<FavoritesPreview>({
    qualificationPathId: pathId,
    document: Option.flatten(document),
    favoriteQuestionCount,
    settings: favoritesSessionSettings(favoriteQuestionCount),
  })
})
