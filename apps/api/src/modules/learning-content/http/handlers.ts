import { Api } from '@inzpro/api-contracts/api'
import { CurrentUser } from '@inzpro/api-contracts/middleware/authentication/current-user'
import { Effect, Layer, Option } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { type CursorPage, mapCursorPage } from '~api/lib/cursor-pagination.js'
import { invalidCursor } from '~api/lib/invalid-cursor.js'
import { accountReadLimit, limitByUser } from '~api/lib/rate-limit.js'
import { withContentAssetAddresses } from '~api/modules/learning-content/application/content-asset-addresses.service.js'
import { getDocumentPackageCandidates } from '~api/modules/learning-content/application/document-package.query.js'
import {
  getDocumentPdfDownloadUrl,
  getDocumentPdfUrl,
} from '~api/modules/learning-content/application/document-pdf.query.js'
import { getDocumentSections } from '~api/modules/learning-content/application/document-sections.query.js'
import {
  getDocumentQuestionCounts,
  getLinkedOralQuestions,
  getLinkedWrittenQuestions,
} from '~api/modules/learning-content/application/linked-questions.query.js'
import { getReferenceDocument } from '~api/modules/learning-content/application/reference-document.query.js'
import { getReferenceDocuments } from '~api/modules/learning-content/application/reference-documents.query.js'
import type { LinkedOralQuestion } from '~api/modules/learning-content/domain/linked-question.model.js'
import type { DocumentSection } from '~api/modules/learning-content/domain/reference-document.model.js'
import { ContentAssetReaderLive } from '~api/modules/learning-content/infrastructure/content-asset.reader.postgres.js'
import { LinkedQuestionReaderLive } from '~api/modules/learning-content/infrastructure/linked-question.reader.postgres.js'
import { ReferenceDocumentReaderLive } from '~api/modules/learning-content/infrastructure/reference-document.reader.postgres.js'
import { failPreparationRead, pathAccessDenied } from '~api/modules/preparation/http/errors.js'
import { PreparationReaderLive } from '~api/modules/preparation/infrastructure/preparation.reader.postgres.js'

import {
  documentDownloadNotAllowed,
  failDocumentPdfSigning,
  failLearningContentRead,
  referenceDocumentNotFound,
} from './errors.js'
import {
  toDocumentPackageCandidateDto,
  toDocumentSectionDtos,
  toLinkedOralQuestionDto,
  toReferenceDocumentDto,
} from './mappers.js'

const signedDocumentSectionDtos = withContentAssetAddresses(
  (sections: ReadonlyArray<DocumentSection>) =>
    sections.flatMap(section => Option.toArray(section.content)),
  toDocumentSectionDtos,
)

const signedLinkedOralQuestionsDto = withContentAssetAddresses(
  (page: CursorPage<LinkedOralQuestion>) => page.data.map(question => question.body),
  (page, addresses) =>
    mapCursorPage(page, question => toLinkedOralQuestionDto(question, addresses)),
)

export const SourcesLive = HttpApiBuilder.group(Api, 'Sources', handlers =>
  handlers
    .handle('GetReferenceDocuments', ({ params, query }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getReferenceDocuments(user.id, params.qualificationPathId, query),
          ),
        ),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          LearningContentReadError: failLearningContentRead,
          InvalidCursor: () => invalidCursor,
        }),
      ),
    )
    .handle('GetReferenceDocument', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getReferenceDocument(user.id, params.qualificationPathId, params.code),
          ),
        ),
        Effect.map(document => ({ document: toReferenceDocumentDto(document) })),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          LearningContentReadError: failLearningContentRead,
          UnknownReferenceDocument: () => referenceDocumentNotFound,
        }),
      ),
    )
    .handle('GetDocumentSections', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getDocumentSections(user.id, params.qualificationPathId, params.code),
          ),
        ),
        Effect.flatMap(signedDocumentSectionDtos),
        Effect.map(sections => ({ sections })),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          LearningContentReadError: failLearningContentRead,
          UnknownReferenceDocument: () => referenceDocumentNotFound,
          ReferenceDocumentTextUnavailable: () => referenceDocumentNotFound,
        }),
      ),
    )
    .handle('GetDocumentPdf', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getDocumentPdfUrl(user.id, params.qualificationPathId, params.code),
          ),
        ),
        Effect.map(url => ({ url })),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          LearningContentReadError: failLearningContentRead,
          FileStorageError: failDocumentPdfSigning,
          UnknownReferenceDocument: () => referenceDocumentNotFound,
          ReferenceDocumentPdfUnavailable: () => referenceDocumentNotFound,
        }),
      ),
    )
    .handle('GetDocumentPdfDownload', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getDocumentPdfDownloadUrl(user.id, params.qualificationPathId, params.code),
          ),
        ),
        Effect.map(url => ({ url })),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          LearningContentReadError: failLearningContentRead,
          FileStorageError: failDocumentPdfSigning,
          UnknownReferenceDocument: () => referenceDocumentNotFound,
          ReferenceDocumentPdfUnavailable: () => referenceDocumentNotFound,
          DocumentDownloadNotAllowed: () => documentDownloadNotAllowed,
        }),
      ),
    )
    .handle('GetDocumentPackageCandidates', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getDocumentPackageCandidates(user.id, params.qualificationPathId),
          ),
        ),
        Effect.map(documents => ({ documents: documents.map(toDocumentPackageCandidateDto) })),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          LearningContentReadError: failLearningContentRead,
        }),
      ),
    )
    .handle('GetDocumentQuestionCounts', ({ params }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getDocumentQuestionCounts(user.id, params.qualificationPathId, params.code),
          ),
        ),
        Effect.map(units => ({ units })),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          LearningContentReadError: failLearningContentRead,
          UnknownReferenceDocument: () => referenceDocumentNotFound,
          ReferenceDocumentTextUnavailable: () => referenceDocumentNotFound,
        }),
      ),
    )
    .handle('GetLinkedWrittenQuestions', ({ params, query: { address, ...page } }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getLinkedWrittenQuestions(
              user.id,
              params.qualificationPathId,
              params.code,
              address,
              page,
            ),
          ),
        ),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          LearningContentReadError: failLearningContentRead,
          InvalidCursor: () => invalidCursor,
          UnknownReferenceDocument: () => referenceDocumentNotFound,
          ReferenceDocumentTextUnavailable: () => referenceDocumentNotFound,
        }),
      ),
    )
    .handle('GetLinkedOralQuestions', ({ params, query: { address, ...page } }) =>
      limitByUser(accountReadLimit).pipe(
        Effect.andThen(
          Effect.flatMap(CurrentUser, user =>
            getLinkedOralQuestions(user.id, params.qualificationPathId, params.code, address, page),
          ),
        ),
        Effect.flatMap(signedLinkedOralQuestionsDto),
        Effect.catchTags({
          PreparationReadError: failPreparationRead,
          PathPermissionDenied: () => pathAccessDenied,
          LearningContentReadError: failLearningContentRead,
          InvalidCursor: () => invalidCursor,
          UnknownReferenceDocument: () => referenceDocumentNotFound,
          ReferenceDocumentTextUnavailable: () => referenceDocumentNotFound,
        }),
      ),
    ),
)

export const SourcesRequestServices = Layer.mergeAll(
  ContentAssetReaderLive,
  LinkedQuestionReaderLive,
  PreparationReaderLive,
  ReferenceDocumentReaderLive,
)
