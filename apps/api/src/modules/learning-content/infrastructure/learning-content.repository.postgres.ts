import type {
  OralKnowledgeCheckOptionId,
  OralKnowledgeCheckRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-knowledge-check'
import { imageAssetIds, type RichContent } from '@inzpro/rich-content/rich-content'
import { Array as Arr, DateTime, Effect, Layer, Option } from 'effect'
import { SqlClient } from 'effect/sql'
import { LearningContentWriteError } from '~api/modules/learning-content/application/errors.js'
import { LearningContentRepository } from '~api/modules/learning-content/application/learning-content.repository.js'
import { UnknownContentAsset } from '~api/modules/learning-content/domain/errors.js'
import {
  initialRevision,
  substantiveChange,
} from '~api/modules/learning-content/domain/learning-content.model.js'

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

    return LearningContentRepository.of({
      createAsset: Effect.fn('LearningContentRepository.createAsset')(function* (asset) {
        const width = 'width' in asset ? asset.width : null
        const height = 'height' in asset ? asset.height : null

        return yield* sql`INSERT INTO content_assets (id,storage_key,media_type,width,height,size_bytes) VALUES (${asset.id},${asset.storageKey},${asset.mediaType},${width},${height},${asset.size})`.pipe(
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
      makeCurrentEdition: Effect.fn('LearningContentRepository.makeCurrentEdition')(
        function* (documentId, editionId) {
          return yield* sql`UPDATE reference_documents SET current_edition_id=${editionId} WHERE id=${documentId}`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new LearningContentWriteError({ cause })),
          )
        },
      ),
      attachDocument: Effect.fn('LearningContentRepository.attachDocument')(
        function* (pathId, documentId) {
          return yield* sql`INSERT INTO path_documents (qualification_path_id,document_id) VALUES (${pathId},${documentId})`.pipe(
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
          return yield* sql`INSERT INTO oral_question_categories (id,name,sort_order) VALUES (${category.id},${category.name},${category.sortOrder})`.pipe(
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

                if (question.published) {
                  yield* sql`UPDATE oral_revisions SET published_at=clock_timestamp() WHERE id=${question.revisionId}`
                }

                yield* sql`UPDATE oral_questions SET current_revision_id=${question.revisionId} WHERE id=${question.id}`
                yield* sql`INSERT INTO path_oral_questions (qualification_path_id,question_id) VALUES (${question.qualificationPathId},${question.id})`
              }),
            )
            .pipe(
              Effect.catchTag('SqlError', cause =>
                Effect.fail(new LearningContentWriteError({ cause })),
              ),
            )
        },
      ),
      assignOralQuestion: Effect.fn('LearningContentRepository.assignOralQuestion')(
        function* (pathId, questionId) {
          return yield* sql`INSERT INTO path_oral_questions (qualification_path_id,question_id) VALUES (${pathId},${questionId})`.pipe(
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

                yield* sql`INSERT INTO oral_revisions (id,question_id,body,answer,change_kind,substantive_revision_id,published_at) VALUES (${revision.revisionId},${revision.questionId},${JSON.stringify(revision.body)}::jsonb,${JSON.stringify(revision.answer)}::jsonb,${revision.changeKind},${substantiveRevisionId},clock_timestamp())`
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
