import type { ContentAssetId } from '@inzpro/domain/modules/learning-content/content-asset'
import { Data } from 'effect'

export class UnknownContentAsset extends Data.TaggedError('UnknownContentAsset')<{
  readonly assetIds: ReadonlyArray<ContentAssetId>
}> {}

export class UnknownReferenceDocument extends Data.TaggedError('UnknownReferenceDocument') {}

export class ReferenceDocumentPdfUnavailable extends Data.TaggedError(
  'ReferenceDocumentPdfUnavailable',
) {}

export class DocumentDownloadNotAllowed extends Data.TaggedError('DocumentDownloadNotAllowed') {}

export class ReferenceDocumentTextUnavailable extends Data.TaggedError(
  'ReferenceDocumentTextUnavailable',
) {}
