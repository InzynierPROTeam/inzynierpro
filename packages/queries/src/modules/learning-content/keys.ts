import type {
  GetDocumentSectionsRequest,
  GetReferenceDocumentRequest,
  GetReferenceDocumentsRequest,
} from '@inzpro/api-client/modules/learning-content'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'

export const learningContentKeys = {
  all: ['learning-content'] as const,
  account: (userId: UserId) => [...learningContentKeys.all, 'account', userId] as const,
  path: (userId: UserId, id: QualificationPathId) =>
    [...learningContentKeys.account(userId), 'path', id] as const,
  getReferenceDocumentsInfinite: (userId: UserId, req: GetReferenceDocumentsRequest) =>
    [
      ...learningContentKeys.path(userId, req.params.qualificationPathId),
      'getReferenceDocumentsInfinite',
      req,
    ] as const,
  getReferenceDocument: (userId: UserId, req: GetReferenceDocumentRequest) =>
    [
      ...learningContentKeys.path(userId, req.params.qualificationPathId),
      'getReferenceDocument',
      req,
    ] as const,
  getDocumentSections: (userId: UserId, req: GetDocumentSectionsRequest) =>
    [
      ...learningContentKeys.path(userId, req.params.qualificationPathId),
      'getDocumentSections',
      req,
    ] as const,
}
