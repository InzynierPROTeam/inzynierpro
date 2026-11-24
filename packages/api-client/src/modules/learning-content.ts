import type {
  GetDocumentSectionsEndpoint,
  GetReferenceDocumentEndpoint,
  GetReferenceDocumentsEndpoint,
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
