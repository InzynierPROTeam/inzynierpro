import { DocumentPageNumber } from '@inzpro/domain/modules/learning-content/document-edition'
import { DocumentSectionAddress } from '@inzpro/domain/modules/learning-content/document-section-address'
import {
  directBasisReference,
  QuestionReferenceKind,
} from '@inzpro/domain/modules/learning-content/question-reference'
import { ReferenceDocumentCode } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { RichContent } from '@inzpro/rich-content/rich-content'
import { Effect, Layer, Option, Schema } from 'effect'
import { SqlClient, type Statement } from 'effect/sql'
import { LearningContentReadError } from '~api/modules/learning-content/application/errors.js'
import { QuestionReferenceReader } from '~api/modules/learning-content/application/question-reference.reader.js'
import { unitInDocumentOrder } from '~api/modules/learning-content/domain/document-section.rules.js'
import type { QuestionReference } from '~api/modules/learning-content/domain/question-reference.model.js'

const ReferenceRow = Schema.Struct({
  position: Schema.Int,
  documentCode: ReferenceDocumentCode,
  documentAbbreviation: Schema.NonEmptyString,
  documentTitle: Schema.NonEmptyString,
  address: Schema.OptionFromNullOr(DocumentSectionAddress),
  page: Schema.OptionFromNullOr(DocumentPageNumber),
  kind: QuestionReferenceKind,
  isCritical: Schema.Boolean,
  isLinked: Schema.Boolean,
})

const FragmentSectionRow = Schema.Struct({
  referencePosition: Schema.Int,
  address: DocumentSectionAddress,
  parentAddress: Schema.OptionFromNullOr(DocumentSectionAddress),
  title: Schema.OptionFromNullOr(Schema.NonEmptyString),
  content: Schema.OptionFromNullOr(RichContent),
})

const toQuestionReference = (
  { position, ...reference }: typeof ReferenceRow.Type,
  fragmentSections: ReadonlyArray<typeof FragmentSectionRow.Type>,
): QuestionReference => ({
  ...reference,
  fragment: Option.flatMap(reference.address, address =>
    reference.kind === directBasisReference && reference.isLinked
      ? Option.some(
          unitInDocumentOrder(
            address,
            fragmentSections.flatMap(({ referencePosition, ...section }) =>
              referencePosition === position ? [section] : [],
            ),
          ),
        )
      : Option.none(),
  ),
})

export const QuestionReferenceReaderLive = Layer.effect(
  QuestionReferenceReader,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const revisionReferences = Effect.fn('QuestionReferenceReader.revisionReferences')(
      function* (pathId: QualificationPathId, revision: Statement.Fragment) {
        const references =
          yield* sql`SELECT r.position,d.code AS document_code,d.abbreviation AS document_abbreviation,d.title AS document_title,r.address,r.pdf_page AS page,r.kind,r.is_critical,
 (pd.document_id IS NOT NULL AND e.id IS NOT NULL AND CASE
   WHEN r.address IS NOT NULL THEN e.availability='full_content' AND EXISTS (SELECT 1 FROM document_section_contents s WHERE s.edition_id=e.id AND s.address=r.address)
   WHEN r.pdf_page IS NOT NULL THEN e.availability='pdf_only'
   ELSE true END) AS is_linked
 FROM question_references r JOIN reference_documents d ON d.id=r.document_id
 LEFT JOIN document_editions e ON e.id=d.current_edition_id AND e.published_at IS NOT NULL
 LEFT JOIN path_documents pd ON pd.qualification_path_id=${pathId} AND pd.document_id=r.document_id
 WHERE ${revision} ORDER BY r.position`.pipe(
            Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(ReferenceRow))),
          )

        const fragmentSections =
          yield* sql`SELECT r.position AS reference_position,s.address,s.parent_address,s.title,s.content
 FROM question_references r JOIN reference_documents d ON d.id=r.document_id
 JOIN document_editions e ON e.id=d.current_edition_id AND e.published_at IS NOT NULL AND e.availability='full_content'
 JOIN document_section_contents s ON s.edition_id=e.id AND (s.address=r.address OR starts_with(s.address, r.address || '/'))
 WHERE ${revision} AND r.kind=${directBasisReference}
 ORDER BY r.position,s.position`.pipe(
            Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(FragmentSectionRow))),
          )

        return references.map(reference => toQuestionReference(reference, fragmentSections))
      },
      Effect.mapError(cause => new LearningContentReadError({ cause })),
    )

    return QuestionReferenceReader.of({
      writtenRevisionReferences: Effect.fn('QuestionReferenceReader.writtenRevisionReferences')(
        (pathId, revisionId) =>
          revisionReferences(pathId, sql`r.written_revision_id=${revisionId}`),
      ),
      oralRevisionReferences: Effect.fn('QuestionReferenceReader.oralRevisionReferences')(
        (pathId, revisionId) => revisionReferences(pathId, sql`r.oral_revision_id=${revisionId}`),
      ),
    })
  }),
)
