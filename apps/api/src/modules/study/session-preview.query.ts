import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/path-access.policy.js'
import { writtenStudySettings } from '~api/modules/study/session-preview.rules.js'

import { StudyDocumentNotFound } from './errors.js'
import { StudyReader } from './study.reader.js'

// A read operation: no StudySession is created and the selected path is unchanged.
export const getSessionPreview = (
  userId: UserId,
  pathId: QualificationPathId,
  documentId: ReferenceDocumentId,
) =>
  Effect.gen(function* () {
    yield* requirePathAccess(userId, pathId, 'written')
    const studyReader = yield* StudyReader
    const found = yield* studyReader.document(userId, pathId, documentId)

    if (Option.isNone(found)) {
      return yield* new StudyDocumentNotFound()
    }

    const document = found.value

    return {
      qualificationPathId: pathId,
      document,
      mode: 'written-study' as const,
      availableQuestionCount: document.availableQuestionCount,
      settings: writtenStudySettings(document.availableQuestionCount),
    }
  })
