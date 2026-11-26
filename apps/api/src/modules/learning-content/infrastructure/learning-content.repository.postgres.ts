import type {
  OralKnowledgeCheckOptionId,
  OralKnowledgeCheckRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-knowledge-check'
import type { OralRevisionId } from '@inzpro/domain/modules/learning-content/oral-question'
import { PathOralCategoryPosition } from '@inzpro/domain/modules/learning-content/oral-question-category'
import { PathDocumentPosition } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QuestionRevisionId } from '@inzpro/domain/modules/learning-content/written-question'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { imageAssetIds, type RichContent } from '@inzpro/rich-content/rich-content'
import { Array as Arr, DateTime, Effect, Layer, Option, Schema } from 'effect'
import { SqlClient, type Statement } from 'effect/sql'
import { LearningContentWriteError } from '~api/modules/learning-content/application/errors.js'
import { LearningContentRepository } from '~api/modules/learning-content/application/learning-content.repository.js'
import { UnknownContentAsset } from '~api/modules/learning-content/domain/errors.js'
import {
  initialRevision,
  type NewQuestionReference,
  substantiveChange,
} from '~api/modules/learning-content/domain/learning-content.model.js'

type ReferenceRevision =
  | { readonly writtenRevisionId: QuestionRevisionId }
  | { readonly oralRevisionId: OralRevisionId }

type KnowledgeCheckOptionInsert = {
  readonly id: OralKnowledgeCheckOptionId
  readonly knowledgeCheckRevisionId: OralKnowledgeCheckRevisionId
  readonly optionPosition: number
  readonly text: string
  readonly isCorrect: boolean
}

export const LearningContentRepositoryLive = Layer.effect(
  LearningContentRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const requireStoredAssets = Effect.fn('LearningContentRepository.requireStoredAssets')(
      function* (...contents: ReadonlyArray<RichContent>) {
        const assetIds = [...new Set(contents.flatMap(imageAssetIds))]

        if (assetIds.length === 0) {
          return
        }

        const rows = yield* sql`SELECT id FROM content_assets WHERE id IN ${sql.in(assetIds)}`
        const stored = new Set(rows.map(row => row.id))
        const missing = assetIds.filter(id => !stored.has(id))

        if (missing.length > 0) {
          return yield* new UnknownContentAsset({ assetIds: missing })
        }
      },
    )

    const insertReferences = Effect.fn('LearningContentRepository.insertReferences')(function* (
      revision: ReferenceRevision,
      references: ReadonlyArray<NewQuestionReference>,
    ) {
      const writtenRevisionId = 'writtenRevisionId' in revision ? revision.writtenRevisionId : null

      const oralRevisionId = 'oralRevisionId' in revision ? revision.oralRevisionId : null

      for (const [index, reference] of references.entries()) {
        const address = Option.getOrNull(reference.address)
        const page = Option.getOrNull(reference.page)

        yield* sql`INSERT INTO question_references (written_revision_id,oral_revision_id,position,document_id,address,pdf_page,kind,is_critical)
 VALUES (${writtenRevisionId},${oralRevisionId},${index + 1},${reference.documentId},${address},${page},${reference.kind},${reference.isCritical})`
      }
    })

    const nextPosition = (table: Statement.Fragment, pathId: QualificationPathId) =>
      sql<{
        readonly position: number
      }>`SELECT coalesce(max(position),0)+1 AS position FROM ${table} WHERE qualification_path_id=${pathId}`.pipe(
        Effect.map(([row]) => row?.position),
      )

    return LearningContentRepository.of({
      createAsset: Effect.fn('LearningContentRepository.createAsset')(function* (asset) {
        const width = 'width' in asset ? asset.width : null
        const height = 'height' in asset ? asset.height : null
        const pageCount = 'pageCount' in asset ? asset.pageCount : null

        return yield* sql`INSERT INTO content_assets (id,storage_key,media_type,width,height,size_bytes,page_count) VALUES (${asset.id},${asset.storageKey},${asset.mediaType},${width},${height},${asset.size},${pageCount})`.pipe(
          Effect.asVoid,
          Effect.mapError(cause => new LearningContentWriteError({ cause })),
        )
      }),
      createDocument: Effect.fn('LearningContentRepository.createDocument')(function* (document) {
        const description = Option.getOrNull(document.description)

        return yield* sql`INSERT INTO reference_documents (id,kind,code,abbreviation,title,description) VALUES (${document.id},${document.kind},${document.code},${document.abbreviation},${document.title},${description})`.pipe(
          Effect.asVoid,
          Effect.mapError(cause => new LearningContentWriteError({ cause })),
        )
      }),
      createEdition: Effect.fn('LearningContentRepository.createEdition')(function* (edition) {
        const effectiveFrom = DateTime.formatIso(edition.effectiveFrom)
        const pdfAssetId = Option.getOrNull(edition.pdfAssetId)
        const publishedAt = edition.published ? sql`clock_timestamp()` : sql`NULL`

        return yield* sql`INSERT INTO document_editions (id,document_id,label,text_kind,effective_from,external_url,pdf_asset_id,availability,downloadable,published_at)
 VALUES (${edition.id},${edition.documentId},${edition.label},${edition.textKind},${effectiveFrom},${edition.externalUrl},${pdfAssetId},${edition.availability},${edition.downloadable},${publishedAt})`.pipe(
          Effect.asVoid,
          Effect.mapError(cause => new LearningContentWriteError({ cause })),
        )
      }),
      saveSectionContent: Effect.fn('LearningContentRepository.saveSectionContent')(
        function* (section) {
          const parentAddress = Option.getOrNull(section.parentAddress)
          const title = Option.getOrNull(section.title)

          const content = Option.match(section.content, {
            onNone: () => null,
            onSome: richContent => JSON.stringify(richContent),
          })

          return yield* sql
            .withTransaction(
              Effect.gen(function* () {
                yield* requireStoredAssets(...Option.toArray(section.content))
                yield* sql`INSERT INTO document_section_contents (edition_id,address,parent_address,position,title,content)
 VALUES (${section.editionId},${section.address},${parentAddress},${section.position},${title},${content}::jsonb)
 ON CONFLICT (edition_id,address) DO UPDATE SET parent_address=EXCLUDED.parent_address,position=EXCLUDED.position,title=EXCLUDED.title,content=EXCLUDED.content`
              }),
            )
            .pipe(
              Effect.catchTag('SqlError', cause =>
                Effect.fail(new LearningContentWriteError({ cause })),
              ),
            )
        },
      ),
      publishEdition: Effect.fn('LearningContentRepository.publishEdition')(function* (editionId) {
        return yield* sql`UPDATE document_editions SET published_at=clock_timestamp() WHERE id=${editionId} AND published_at IS NULL`.pipe(
          Effect.asVoid,
          Effect.mapError(cause => new LearningContentWriteError({ cause })),
        )
      }),
      recordSectionRelocation: Effect.fn('LearningContentRepository.recordSectionRelocation')(
        function* (relocation) {
          return yield* sql`INSERT INTO section_relocations (edition_id,from_address,to_address,reason) VALUES (${relocation.editionId},${relocation.fromAddress},${relocation.toAddress},${relocation.reason})`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new LearningContentWriteError({ cause })),
          )
        },
      ),
      makeCurrentEdition: Effect.fn('LearningContentRepository.makeCurrentEdition')(
        function* (documentId, editionId) {
          return yield* sql`UPDATE reference_documents SET current_edition_id=${editionId} WHERE id=${documentId}`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new LearningContentWriteError({ cause })),
          )
        },
      ),
      nextDocumentPosition: Effect.fn('LearningContentRepository.nextDocumentPosition')(
        function* (pathId) {
          return yield* nextPosition(sql`path_documents`, pathId).pipe(
            Effect.flatMap(Schema.decodeUnknownEffect(PathDocumentPosition)),
            Effect.mapError(cause => new LearningContentWriteError({ cause })),
          )
        },
      ),
      attachDocument: Effect.fn('LearningContentRepository.attachDocument')(
        function* (pathId, documentId, position) {
          return yield* sql`INSERT INTO path_documents (qualification_path_id,document_id,position) VALUES (${pathId},${documentId},${position})`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new LearningContentWriteError({ cause })),
          )
        },
      ),
      attachQuestion: Effect.fn('LearningContentRepository.attachQuestion')(
        function* (pathId, documentId, questionId) {
          return yield* sql`INSERT INTO path_questions (qualification_path_id,document_id,question_id) VALUES (${pathId},${documentId},${questionId})`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new LearningContentWriteError({ cause })),
          )
        },
      ),
      createQuestion: Effect.fn('LearningContentRepository.createQuestion')(function* (question) {
        return yield* sql
          .withTransaction(
            Effect.gen(function* () {
              yield* requireStoredAssets(question.explanation)
              yield* sql`INSERT INTO written_questions (id,document_id) VALUES (${question.id},${question.documentId})`
              yield* sql`INSERT INTO question_revisions (id,question_id,body,explanation,change_kind,substantive_revision_id) VALUES (${question.revisionId},${question.id},${question.body},${JSON.stringify(question.explanation)}::jsonb,${initialRevision},${question.revisionId})`

              for (const answer of question.answers) {
                yield* sql`INSERT INTO question_answers (id,question_revision_id,text,is_correct) VALUES (${answer.id},${answer.questionRevisionId},${answer.text},${answer.isCorrect})`
              }

              yield* insertReferences(
                { writtenRevisionId: question.revisionId },
                question.references,
              )

              if (question.published) {
                yield* sql`UPDATE question_revisions SET published_at=clock_timestamp() WHERE id=${question.revisionId}`
              }

              yield* sql`UPDATE written_questions SET current_revision_id=${question.revisionId} WHERE id=${question.id}`
              yield* sql`INSERT INTO path_questions (qualification_path_id,document_id,question_id) VALUES (${question.qualificationPathId},${question.documentId},${question.id})`
            }),
          )
          .pipe(
            Effect.catchTag('SqlError', cause =>
              Effect.fail(new LearningContentWriteError({ cause })),
            ),
          )
      }),
      publishRevision: Effect.fn('LearningContentRepository.publishRevision')(function* (revision) {
        return yield* sql
          .withTransaction(
            Effect.gen(function* () {
              yield* requireStoredAssets(revision.explanation)

              const substantiveRevisionId =
                revision.changeKind === substantiveChange
                  ? sql`${revision.revisionId}::uuid`
                  : sql`(SELECT r.substantive_revision_id FROM written_questions q JOIN question_revisions r ON r.id=q.current_revision_id WHERE q.id=${revision.questionId})`

              yield* sql`INSERT INTO question_revisions (id,question_id,body,explanation,change_kind,substantive_revision_id) VALUES (${revision.revisionId},${revision.questionId},${revision.body},${JSON.stringify(revision.explanation)}::jsonb,${revision.changeKind},${substantiveRevisionId})`

              for (const answer of revision.answers) {
                yield* sql`INSERT INTO question_answers (id,question_revision_id,text,is_correct) VALUES (${answer.id},${answer.questionRevisionId},${answer.text},${answer.isCorrect})`
              }

              yield* insertReferences(
                { writtenRevisionId: revision.revisionId },
                revision.references,
              )
              yield* sql`UPDATE question_revisions SET published_at=clock_timestamp() WHERE id=${revision.revisionId}`
              yield* sql`UPDATE written_questions SET current_revision_id=${revision.revisionId} WHERE id=${revision.questionId}`
            }),
          )
          .pipe(
            Effect.catchTag('SqlError', cause =>
              Effect.fail(new LearningContentWriteError({ cause })),
            ),
          )
      }),
      addWrittenReference: Effect.fn('LearningContentRepository.addWrittenReference')(
        function* (revisionId, reference) {
          const address = Option.getOrNull(reference.address)
          const page = Option.getOrNull(reference.page)

          return yield* sql`INSERT INTO question_references (written_revision_id,position,document_id,address,pdf_page,kind,is_critical)
 SELECT ${revisionId},coalesce(max(position),0)+1,${reference.documentId},${address},${page},${reference.kind},${reference.isCritical} FROM question_references WHERE written_revision_id=${revisionId}`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new LearningContentWriteError({ cause })),
          )
        },
      ),
      withdrawRevision: Effect.fn('LearningContentRepository.withdrawRevision')(
        function* (withdrawal) {
          return yield* sql`UPDATE question_revisions SET withdrawn_at=clock_timestamp(),withdrawal_reason=${withdrawal.reason}
 WHERE id=${withdrawal.revisionId} AND published_at IS NOT NULL AND withdrawn_at IS NULL`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new LearningContentWriteError({ cause })),
          )
        },
      ),
      createOralCategory: Effect.fn('LearningContentRepository.createOralCategory')(
        function* (category) {
          return yield* sql`INSERT INTO oral_question_categories (id,name) VALUES (${category.id},${category.name})`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new LearningContentWriteError({ cause })),
          )
        },
      ),
      createOralQuestion: Effect.fn('LearningContentRepository.createOralQuestion')(
        function* (question) {
          return yield* sql
            .withTransaction(
              Effect.gen(function* () {
                yield* requireStoredAssets(question.body, question.answer)
                yield* sql`INSERT INTO oral_questions (id,category_id,category_position) VALUES (${question.id},${question.categoryId},${question.position})`
                yield* sql`INSERT INTO oral_revisions (id,question_id,body,answer,change_kind,substantive_revision_id) VALUES (${question.revisionId},${question.id},${JSON.stringify(question.body)}::jsonb,${JSON.stringify(question.answer)}::jsonb,${initialRevision},${question.revisionId})`
                yield* insertReferences(
                  { oralRevisionId: question.revisionId },
                  question.references,
                )

                if (question.published) {
                  yield* sql`UPDATE oral_revisions SET published_at=clock_timestamp() WHERE id=${question.revisionId}`
                }

                yield* sql`UPDATE oral_questions SET current_revision_id=${question.revisionId} WHERE id=${question.id}`
              }),
            )
            .pipe(
              Effect.catchTag('SqlError', cause =>
                Effect.fail(new LearningContentWriteError({ cause })),
              ),
            )
        },
      ),
      hasOralCategory: Effect.fn('LearningContentRepository.hasOralCategory')(
        function* (pathId, categoryId) {
          return yield* sql`SELECT 1 FROM path_oral_categories WHERE qualification_path_id=${pathId} AND category_id=${categoryId} LIMIT 1`.pipe(
            Effect.map(rows => rows.length > 0),
            Effect.mapError(cause => new LearningContentWriteError({ cause })),
          )
        },
      ),
      nextOralCategoryPosition: Effect.fn('LearningContentRepository.nextOralCategoryPosition')(
        function* (pathId) {
          return yield* nextPosition(sql`path_oral_categories`, pathId).pipe(
            Effect.flatMap(Schema.decodeUnknownEffect(PathOralCategoryPosition)),
            Effect.mapError(cause => new LearningContentWriteError({ cause })),
          )
        },
      ),
      attachOralCategory: Effect.fn('LearningContentRepository.attachOralCategory')(
        function* (pathId, categoryId, position) {
          return yield* sql`INSERT INTO path_oral_categories (qualification_path_id,category_id,position) VALUES (${pathId},${categoryId},${position})`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new LearningContentWriteError({ cause })),
          )
        },
      ),
      assignOralQuestion: Effect.fn('LearningContentRepository.assignOralQuestion')(
        function* (pathId, question) {
          return yield* sql`INSERT INTO path_oral_questions (qualification_path_id,category_id,question_id) VALUES (${pathId},${question.categoryId},${question.id})`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new LearningContentWriteError({ cause })),
          )
        },
      ),
      linkOralQuestionToChamber: Effect.fn('LearningContentRepository.linkOralQuestionToChamber')(
        function* (link) {
          const recordedAt = DateTime.formatIso(link.recordedAt)

          return yield* sql`INSERT INTO oral_question_regional_links (question_id,district_chamber_id,source_kind,recorded_at) VALUES (${link.questionId},${link.districtChamberId},${link.sourceKind},${recordedAt})`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new LearningContentWriteError({ cause })),
          )
        },
      ),
      editOralDraft: Effect.fn('LearningContentRepository.editOralDraft')(function* (edit) {
        return yield* sql
          .withTransaction(
            Effect.gen(function* () {
              yield* requireStoredAssets(edit.body, edit.answer)
              yield* sql`UPDATE oral_revisions SET body=${JSON.stringify(edit.body)}::jsonb,answer=${JSON.stringify(edit.answer)}::jsonb WHERE id=${edit.revisionId}`
            }),
          )
          .pipe(
            Effect.catchTag('SqlError', cause =>
              Effect.fail(new LearningContentWriteError({ cause })),
            ),
          )
      }),
      publishOralRevision: Effect.fn('LearningContentRepository.publishOralRevision')(
        function* (revision) {
          return yield* sql
            .withTransaction(
              Effect.gen(function* () {
                yield* requireStoredAssets(revision.body, revision.answer)

                const substantiveRevisionId =
                  revision.changeKind === substantiveChange
                    ? sql`${revision.revisionId}::uuid`
                    : sql`(SELECT r.substantive_revision_id FROM oral_questions q JOIN oral_revisions r ON r.id=q.current_revision_id WHERE q.id=${revision.questionId})`

                yield* sql`INSERT INTO oral_revisions (id,question_id,body,answer,change_kind,substantive_revision_id) VALUES (${revision.revisionId},${revision.questionId},${JSON.stringify(revision.body)}::jsonb,${JSON.stringify(revision.answer)}::jsonb,${revision.changeKind},${substantiveRevisionId})`
                yield* insertReferences(
                  { oralRevisionId: revision.revisionId },
                  revision.references,
                )
                yield* sql`UPDATE oral_revisions SET published_at=clock_timestamp() WHERE id=${revision.revisionId}`
                yield* sql`UPDATE oral_questions SET current_revision_id=${revision.revisionId} WHERE id=${revision.questionId}`
              }),
            )
            .pipe(
              Effect.catchTag('SqlError', cause =>
                Effect.fail(new LearningContentWriteError({ cause })),
              ),
            )
        },
      ),
      createKnowledgeCheck: Effect.fn('LearningContentRepository.createKnowledgeCheck')(
        function* (check) {
          const options: ReadonlyArray<KnowledgeCheckOptionInsert> = check.options.map(
            (option, index) => ({
              id: option.id,
              knowledgeCheckRevisionId: check.revisionId,
              optionPosition: index + 1,
              text: option.text,
              isCorrect: option.isCorrect,
            }),
          )

          return yield* sql
            .withTransaction(
              Effect.gen(function* () {
                yield* requireStoredAssets(check.explanation)
                yield* sql`INSERT INTO oral_knowledge_checks (id,question_id) VALUES (${check.id},${check.questionId})`
                yield* sql`INSERT INTO oral_knowledge_check_revisions (id,knowledge_check_id,question_id,oral_revision_id,format,prompt,explanation) VALUES (${check.revisionId},${check.id},${check.questionId},${check.oralRevisionId},${check.format},${check.prompt},${JSON.stringify(check.explanation)}::jsonb)`

                if (Arr.isReadonlyArrayNonEmpty(options)) {
                  yield* sql`INSERT INTO oral_knowledge_check_options ${sql.insert(options)}`
                }

                if (check.published) {
                  yield* sql`UPDATE oral_knowledge_check_revisions SET published_at=clock_timestamp() WHERE id=${check.revisionId}`
                }

                yield* sql`UPDATE oral_knowledge_checks SET current_revision_id=${check.revisionId} WHERE id=${check.id}`
              }),
            )
            .pipe(
              Effect.catchTag('SqlError', cause =>
                Effect.fail(new LearningContentWriteError({ cause })),
              ),
            )
        },
      ),
      withdrawOralRevision: Effect.fn('LearningContentRepository.withdrawOralRevision')(
        function* (withdrawal) {
          return yield* sql`UPDATE oral_revisions SET withdrawn_at=clock_timestamp(),withdrawal_reason=${withdrawal.reason}
 WHERE id=${withdrawal.revisionId} AND published_at IS NOT NULL AND withdrawn_at IS NULL`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new LearningContentWriteError({ cause })),
          )
        },
      ),
    })
  }),
)
