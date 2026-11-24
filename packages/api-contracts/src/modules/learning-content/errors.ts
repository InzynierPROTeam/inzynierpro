import { Schema } from 'effect'
import {
  errorFields,
  ForbiddenAnnotations,
  NotFoundAnnotations,
} from '~api-contracts/utils/api-error.js'

export class ReferenceDocumentNotFound extends Schema.TaggedError<
  ReferenceDocumentNotFound,
  { readonly brand: unique symbol }
>()(
  'ReferenceDocumentNotFound',
  errorFields('reference_document_not_found'),
  NotFoundAnnotations(),
) {}

export class DocumentDownloadNotAllowed extends Schema.TaggedError<
  DocumentDownloadNotAllowed,
  { readonly brand: unique symbol }
>()(
  'DocumentDownloadNotAllowed',
  errorFields('document_download_not_allowed'),
  ForbiddenAnnotations(),
) {}
