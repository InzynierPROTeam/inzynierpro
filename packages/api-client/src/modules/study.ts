import type {
  GetDocumentsEndpoint,
  GetDocumentEndpoint,
  GetSessionPreviewEndpoint,
  GetOralMaterialsEndpoint,
} from '@inzpro/api-contracts/modules/study/api'
import type { Effect } from 'effect'
import { apiAction } from '~api-client/lib/api-action.js'
import type { InferEndpointRequest } from '~api-client/lib/types.js'

export const getDocuments = (req: GetDocumentsRequest) =>
  apiAction(api => api.Study.GetDocuments(req))

export type GetDocumentsRequest = InferEndpointRequest<typeof GetDocumentsEndpoint>

export type GetDocumentsRes = Effect.Success<ReturnType<typeof getDocuments>>

export type GetDocumentsError = Effect.Error<ReturnType<typeof getDocuments>>

export const getSessionPreview = (req: GetSessionPreviewRequest) =>
  apiAction(api => api.Study.GetSessionPreview(req))

export type GetSessionPreviewRequest = InferEndpointRequest<typeof GetSessionPreviewEndpoint>

export type GetSessionPreviewRes = Effect.Success<ReturnType<typeof getSessionPreview>>

export type GetSessionPreviewError = Effect.Error<ReturnType<typeof getSessionPreview>>

export const getOralMaterials = (req: GetOralMaterialsRequest) =>
  apiAction(api => api.Study.GetOralMaterials(req))

export type GetOralMaterialsRequest = InferEndpointRequest<typeof GetOralMaterialsEndpoint>

export type GetOralMaterialsRes = Effect.Success<ReturnType<typeof getOralMaterials>>

export type GetOralMaterialsError = Effect.Error<ReturnType<typeof getOralMaterials>>

export const getDocument = (req: GetDocumentRequest) => apiAction(api => api.Study.GetDocument(req))

export type GetDocumentRequest = InferEndpointRequest<typeof GetDocumentEndpoint>

export type GetDocumentRes = Effect.Success<ReturnType<typeof getDocument>>

export type GetDocumentError = Effect.Error<ReturnType<typeof getDocument>>
