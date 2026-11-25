import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { DocumentSectionAddress } from '@inzpro/domain/modules/learning-content/document-section-address'
import type { ReferenceDocumentCode } from '@inzpro/domain/modules/learning-content/reference-document'
import { oralExamAccess, writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect } from 'effect'
import type { CursorPageRequest } from '~api/lib/cursor-pagination.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'

import { requireFullContentDocument } from './document-sections.query.js'
import { LinkedQuestionReader } from './linked-question.reader.js'

export const getDocumentQuestionCounts = Effect.fn('LearningContent.getDocumentQuestionCounts')(
  function* (userId: UserId, pathId: QualificationPathId, code: ReferenceDocumentCode) {
    const assignment = yield* requirePathAccess(userId, pathId)
    const document = yield* requireFullContentDocument(pathId, code)
    const linkedQuestionReader = yield* LinkedQuestionReader

    return yield* linkedQuestionReader.unitQuestionCounts(
      { pathId, documentId: document.id },
      assignment.accessScope,
      document.edition.id,
    )
  },
)

export const getLinkedWrittenQuestions = Effect.fn('LearningContent.getLinkedWrittenQuestions')(
  function* (
    userId: UserId,
    pathId: QualificationPathId,
    code: ReferenceDocumentCode,
    address: DocumentSectionAddress,
    page: CursorPageRequest,
  ) {
    yield* requirePathAccess(userId, pathId, { part: writtenExamAccess })
    const document = yield* requireFullContentDocument(pathId, code)
    const linkedQuestionReader = yield* LinkedQuestionReader

    return yield* linkedQuestionReader.linkedWrittenQuestions(
      { pathId, documentId: document.id },
      address,
      page,
    )
  },
)

export const getLinkedOralQuestions = Effect.fn('LearningContent.getLinkedOralQuestions')(
  function* (
    userId: UserId,
    pathId: QualificationPathId,
    code: ReferenceDocumentCode,
    address: DocumentSectionAddress,
    page: CursorPageRequest,
  ) {
    yield* requirePathAccess(userId, pathId, { part: oralExamAccess })
    const document = yield* requireFullContentDocument(pathId, code)
    const linkedQuestionReader = yield* LinkedQuestionReader

    return yield* linkedQuestionReader.linkedOralQuestions(
      { pathId, documentId: document.id },
      address,
      page,
    )
  },
)
