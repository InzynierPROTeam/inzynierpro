import {
  getDocumentSections,
  type GetDocumentSectionsRequest,
  getReferenceDocument,
  getReferenceDocuments,
  type GetReferenceDocumentRequest,
  type GetReferenceDocumentsRequest,
} from '@inzpro/api-client/modules/learning-content'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { HttpClient } from 'effect/http'
import {
  effectInfiniteQueryOptions,
  effectQueryOptions,
} from '~queries/lib/effect-query-options.js'

import { learningContentKeys } from './keys.js'

export const referenceDocumentsInfiniteQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetReferenceDocumentsRequest,
) =>
  effectInfiniteQueryOptions(
    learningContentKeys.getReferenceDocumentsInfinite(userId, req),
    cursor => getReferenceDocuments({ ...req, query: { ...req.query, cursor } }),
    httpClient,
    req.query.cursor,
  )

export const referenceDocumentQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetReferenceDocumentRequest,
) =>
  effectQueryOptions(
    learningContentKeys.getReferenceDocument(userId, req),
    getReferenceDocument(req),
    httpClient,
  )

export const documentSectionsQueryOptions = (
  httpClient: HttpClient.HttpClient,
  userId: UserId,
  req: GetDocumentSectionsRequest,
) =>
  effectQueryOptions(
    learningContentKeys.getDocumentSections(userId, req),
    getDocumentSections(req),
    httpClient,
  )
