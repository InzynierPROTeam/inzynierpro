import type {
  GetDocumentPackageCandidatesEndpoint,
  GetDocumentPdfDownloadEndpoint,
  GetDocumentPdfEndpoint,
  GetDocumentQuestionCountsEndpoint,
  GetDocumentSectionsEndpoint,
  GetReferenceDocumentEndpoint,
  GetReferenceDocumentsEndpoint,
  GetLinkedOralQuestionsEndpoint,
  GetLinkedWrittenQuestionsEndpoint,
} from '@inzpro/api-contracts/modules/learning-content/api'
import type { Effect } from 'effect'
import { apiAction } from '~api-client/lib/api-action.js'
import type { InferEndpointRequest } from '~api-client/lib/types.js'

export const getReferenceDocuments = (req: GetReferenceDocumentsRequest) =>
  apiAction(api => api.Sources.GetReferenceDocuments(req))

export type GetReferenceDocumentsRequest = InferEndpointRequest<
  typeof GetReferenceDocumentsEndpoint
>

export type GetReferenceDocumentsRes = Effect.Success<ReturnType<typeof getReferenceDocuments>>

export type GetReferenceDocumentsError = Effect.Error<ReturnType<typeof getReferenceDocuments>>

export const getReferenceDocument = (req: GetReferenceDocumentRequest) =>
  apiAction(api => api.Sources.GetReferenceDocument(req))

export type GetReferenceDocumentRequest = InferEndpointRequest<typeof GetReferenceDocumentEndpoint>

export type GetReferenceDocumentRes = Effect.Success<ReturnType<typeof getReferenceDocument>>

export type GetReferenceDocumentError = Effect.Error<ReturnType<typeof getReferenceDocument>>

export const getDocumentSections = (req: GetDocumentSectionsRequest) =>
  apiAction(api => api.Sources.GetDocumentSections(req))

export type GetDocumentSectionsRequest = InferEndpointRequest<typeof GetDocumentSectionsEndpoint>

export type GetDocumentSectionsRes = Effect.Success<ReturnType<typeof getDocumentSections>>

export type GetDocumentSectionsError = Effect.Error<ReturnType<typeof getDocumentSections>>

export const getDocumentPdf = (req: GetDocumentPdfRequest) =>
  apiAction(api => api.Sources.GetDocumentPdf(req))

export type GetDocumentPdfRequest = InferEndpointRequest<typeof GetDocumentPdfEndpoint>

export type GetDocumentPdfRes = Effect.Success<ReturnType<typeof getDocumentPdf>>

export type GetDocumentPdfError = Effect.Error<ReturnType<typeof getDocumentPdf>>

export const getDocumentPdfDownload = (req: GetDocumentPdfDownloadRequest) =>
  apiAction(api => api.Sources.GetDocumentPdfDownload(req))

export type GetDocumentPdfDownloadRequest = InferEndpointRequest<
  typeof GetDocumentPdfDownloadEndpoint
>

export type GetDocumentPdfDownloadRes = Effect.Success<ReturnType<typeof getDocumentPdfDownload>>

export type GetDocumentPdfDownloadError = Effect.Error<ReturnType<typeof getDocumentPdfDownload>>

export const getDocumentPackageCandidates = (req: GetDocumentPackageCandidatesRequest) =>
  apiAction(api => api.Sources.GetDocumentPackageCandidates(req))

export type GetDocumentPackageCandidatesRequest = InferEndpointRequest<
  typeof GetDocumentPackageCandidatesEndpoint
>

export type GetDocumentPackageCandidatesRes = Effect.Success<
  ReturnType<typeof getDocumentPackageCandidates>
>

export type GetDocumentPackageCandidatesError = Effect.Error<
  ReturnType<typeof getDocumentPackageCandidates>
>

export const getDocumentQuestionCounts = (req: GetDocumentQuestionCountsRequest) =>
  apiAction(api => api.Sources.GetDocumentQuestionCounts(req))

export type GetDocumentQuestionCountsRequest = InferEndpointRequest<
  typeof GetDocumentQuestionCountsEndpoint
>

export type GetDocumentQuestionCountsRes = Effect.Success<
  ReturnType<typeof getDocumentQuestionCounts>
>

export type GetDocumentQuestionCountsError = Effect.Error<
  ReturnType<typeof getDocumentQuestionCounts>
>

export const getLinkedWrittenQuestions = (req: GetLinkedWrittenQuestionsRequest) =>
  apiAction(api => api.Sources.GetLinkedWrittenQuestions(req))

export type GetLinkedWrittenQuestionsRequest = InferEndpointRequest<
  typeof GetLinkedWrittenQuestionsEndpoint
>

export type GetLinkedWrittenQuestionsRes = Effect.Success<
  ReturnType<typeof getLinkedWrittenQuestions>
>

export type GetLinkedWrittenQuestionsError = Effect.Error<
  ReturnType<typeof getLinkedWrittenQuestions>
>

export const getLinkedOralQuestions = (req: GetLinkedOralQuestionsRequest) =>
  apiAction(api => api.Sources.GetLinkedOralQuestions(req))

export type GetLinkedOralQuestionsRequest = InferEndpointRequest<
  typeof GetLinkedOralQuestionsEndpoint
>

export type GetLinkedOralQuestionsRes = Effect.Success<ReturnType<typeof getLinkedOralQuestions>>

export type GetLinkedOralQuestionsError = Effect.Error<ReturnType<typeof getLinkedOralQuestions>>
