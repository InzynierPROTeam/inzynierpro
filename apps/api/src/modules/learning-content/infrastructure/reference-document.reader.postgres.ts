import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { ExternalUrl } from '@inzpro/domain/common/external-url'
import {
  ContentAvailability,
  DocumentEditionId,
  EditionTextKind,
} from '@inzpro/domain/modules/learning-content/document-edition'
import {
  ReferenceDocumentCode,
  ReferenceDocumentId,
  ReferenceDocumentKind,
} from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Array as Arr, Effect, Layer, Option, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import { makeCursorPaginator } from '~api/lib/cursor-pagination.js'
import { LearningContentReadError } from '~api/modules/learning-content/application/errors.js'
import { ReferenceDocumentReader } from '~api/modules/learning-content/application/reference-document.reader.js'
import { inDocumentOrder } from '~api/modules/learning-content/domain/document-section.rules.js'
import {
  DocumentSection,
  type PublishedReferenceDocument,
  ReferenceDocumentSummary,
} from '~api/modules/learning-content/domain/reference-document.model.js'

const PublishedDocumentRow = Schema.Struct({
  id: ReferenceDocumentId,
  code: ReferenceDocumentCode,
  kind: ReferenceDocumentKind,
  abbreviation: Schema.NonEmptyString,
  title: Schema.NonEmptyString,
  description: Schema.OptionFromNullOr(Schema.NonEmptyString),
  editionId: DocumentEditionId,
  editionLabel: Schema.NonEmptyString,
  textKind: EditionTextKind,
  effectiveFrom: DateTimeUtc,
  externalUrl: ExternalUrl,
  availability: ContentAvailability,
  downloadable: Schema.Boolean,
})

const toPublishedDocument = (
  row: typeof PublishedDocumentRow.Type,
): PublishedReferenceDocument => ({
  id: row.id,
  code: row.code,
  kind: row.kind,
  abbreviation: row.abbreviation,
  title: row.title,
  description: row.description,
  edition: {
    id: row.editionId,
    label: row.editionLabel,
    textKind: row.textKind,
    effectiveFrom: row.effectiveFrom,
    externalUrl: row.externalUrl,
    availability: row.availability,
    downloadable: row.downloadable,
  },
})

export const ReferenceDocumentReaderLive = Layer.effect(
  ReferenceDocumentReader,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const publishedPathDocuments = (pathId: QualificationPathId) =>
      sql`FROM path_documents pd JOIN reference_documents d ON d.id=pd.document_id
 JOIN document_editions e ON e.id=d.current_edition_id AND e.published_at IS NOT NULL
 WHERE pd.qualification_path_id=${pathId}`

    const documentsPage = makeCursorPaginator(sql, Schema.Struct({ code: ReferenceDocumentCode }), [
      ['code', sql`d.code`, 'asc'],
    ])

    return ReferenceDocumentReader.of({
      pathDocuments: Effect.fn('ReferenceDocumentReader.pathDocuments')(
        function* (pathId, req) {
          return yield* documentsPage(
            req,
            page =>
              sql`SELECT d.id,d.code,d.kind,d.abbreviation,d.title,e.label AS edition_label ${publishedPathDocuments(pathId)}
 AND ${page.after} ORDER BY ${page.orderBy} LIMIT ${page.limit}`.pipe(
                Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(ReferenceDocumentSummary))),
              ),
            row => ({ code: row.code }),
          )
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new LearningContentReadError({ cause })),
          SchemaError: cause => Effect.fail(new LearningContentReadError({ cause })),
        }),
      ),
      pathDocument: Effect.fn('ReferenceDocumentReader.pathDocument')(
        function* (pathId, code) {
          const rows =
            yield* sql`SELECT d.id,d.code,d.kind,d.abbreviation,d.title,d.description,e.id AS edition_id,e.label AS edition_label,
 e.text_kind,e.effective_from,e.external_url,e.availability,e.downloadable ${publishedPathDocuments(pathId)} AND d.code=${code} LIMIT 1`

          const documents = yield* Schema.decodeUnknownEffect(Schema.Array(PublishedDocumentRow))(
            rows,
          )

          return Arr.head(documents).pipe(Option.map(toPublishedDocument))
        },
        Effect.mapError(cause => new LearningContentReadError({ cause })),
      ),
      editionSections: Effect.fn('ReferenceDocumentReader.editionSections')(
        function* (editionId) {
          const rows =
            yield* sql`SELECT address,parent_address,title,content FROM document_section_contents WHERE edition_id=${editionId} ORDER BY position`

          return inDocumentOrder(
            yield* Schema.decodeUnknownEffect(Schema.Array(DocumentSection))(rows),
          )
        },
        Effect.mapError(cause => new LearningContentReadError({ cause })),
      ),
    })
  }),
)
