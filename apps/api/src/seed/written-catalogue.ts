import {
  type Image,
  RichContent,
  richContentVersion,
  type Text,
} from '@inzpro/rich-content/rich-content'
import { Effect, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import {
  cosmeticChange,
  initialRevision,
} from '~api/modules/learning-content/domain/learning-content.model.js'

import { catalogueId } from './catalogue-id.js'
import { seedContentAssets } from './content-assets.js'
import {
  seedQuestionReferences,
  writtenLaterRevisionReferences,
  writtenQuestionReferences,
} from './question-references.js'
import { seededReferenceDocumentIds, seedReferenceDocuments } from './reference-documents.js'
import { buildingLaw, questions, laterRevisions } from './written-content.js'

const explanationJson = (paragraph: ReadonlyArray<Text>, figure?: Image['attrs']) =>
  Schema.decodeEffect(RichContent)({
    version: richContentVersion,
    doc: {
      type: 'doc',
      content: [
        { type: 'paragraph', content: paragraph },
        ...(figure === undefined ? [] : [{ type: 'image' as const, attrs: figure }]),
      ],
    },
  }).pipe(Effect.map(content => JSON.stringify(content)))

export const seedWrittenCatalogue = Effect.fn('seedWrittenCatalogue')(function* (
  cataloguePathIds: ReadonlyArray<string>,
) {
  const sql = yield* SqlClient.SqlClient
  yield* seedContentAssets
  yield* seedReferenceDocuments

  for (const pathId of cataloguePathIds) {
    const documentIds = pathId === catalogueId('10', 2) ? [buildingLaw] : seededReferenceDocumentIds

    for (const [index, documentId] of documentIds.entries()) {
      yield* sql`INSERT INTO path_documents (qualification_path_id,document_id,position) VALUES (${pathId},${documentId},${index + 1})
        ON CONFLICT (qualification_path_id,document_id) DO UPDATE SET position=EXCLUDED.position`
    }
  }

  for (const [questionIndex, question] of questions.entries()) {
    const n = questionIndex + 1
    const questionId = catalogueId('30', n)
    const revisionId = catalogueId('43', n)
    const { documentId } = question
    const explanation = yield* explanationJson(question.explanation, question.figure)
    yield* sql`INSERT INTO written_questions (id, document_id) VALUES (${questionId}, ${documentId}) ON CONFLICT DO NOTHING`
    yield* sql`INSERT INTO question_revisions (id,question_id,body,explanation,change_kind,substantive_revision_id)
        VALUES (${revisionId},${questionId},${question.body},${explanation}::jsonb,${initialRevision},${revisionId}) ON CONFLICT DO NOTHING`

    const revisions =
      yield* sql`SELECT published_at FROM question_revisions WHERE id=${revisionId} LIMIT 1`

    if (revisions[0]?.publishedAt === null) {
      for (const [index, text] of question.answers.entries()) {
        const answerId = catalogueId('44', n * 10 + index + 1)
        const isCorrect = index === 0
        yield* sql`INSERT INTO question_answers (id,question_revision_id,text,is_correct) VALUES (${answerId},${revisionId},${text},${isCorrect}) ON CONFLICT DO NOTHING`
      }

      yield* seedQuestionReferences(
        { writtenRevisionId: revisionId },
        writtenQuestionReferences[questionIndex] ?? [],
      )
      yield* sql`UPDATE question_revisions SET published_at=clock_timestamp() WHERE id=${revisionId}`
    }

    yield* sql`UPDATE written_questions SET current_revision_id = ${revisionId} WHERE id = ${questionId} AND (current_revision_id IS NULL OR current_revision_id = ${catalogueId('41', n)})`
    yield* sql`INSERT INTO path_questions (qualification_path_id, document_id, question_id)
        VALUES ('10000000-0000-4000-8000-000000000001', ${documentId}, ${questionId}) ON CONFLICT DO NOTHING`
  }

  for (const revision of laterRevisions) {
    const n = revision.questionNumber
    const questionId = catalogueId('30', n)
    const previousId = catalogueId('43', n)
    const revisionId = catalogueId('45', n)

    const substantiveRevisionId = revision.changeKind === cosmeticChange ? previousId : revisionId

    const explanation = yield* explanationJson(revision.explanation)

    yield* sql`INSERT INTO question_revisions (id,question_id,body,explanation,change_kind,substantive_revision_id)
        VALUES (${revisionId},${questionId},${revision.body},${explanation}::jsonb,${revision.changeKind},${substantiveRevisionId}) ON CONFLICT DO NOTHING`

    const revisions =
      yield* sql`SELECT published_at FROM question_revisions WHERE id=${revisionId} LIMIT 1`

    if (revisions[0]?.publishedAt === null) {
      for (const [index, text] of revision.answers.entries()) {
        const answerId = catalogueId('46', n * 10 + index + 1)
        const isCorrect = index === 0
        yield* sql`INSERT INTO question_answers (id,question_revision_id,text,is_correct) VALUES (${answerId},${revisionId},${text},${isCorrect}) ON CONFLICT DO NOTHING`
      }

      yield* seedQuestionReferences(
        { writtenRevisionId: revisionId },
        writtenLaterRevisionReferences.get(n) ?? [],
      )
      yield* sql`UPDATE question_revisions SET published_at=clock_timestamp() WHERE id=${revisionId}`
    }

    yield* sql`UPDATE written_questions SET current_revision_id=${revisionId} WHERE id=${questionId} AND current_revision_id=${previousId}`
  }

  for (const n of [1, 2, 4]) {
    yield* sql`INSERT INTO path_questions (qualification_path_id, document_id, question_id)
        VALUES ('10000000-0000-4000-8000-000000000002', ${buildingLaw}, ${catalogueId('30', n)}) ON CONFLICT DO NOTHING`
  }

  for (const pathId of cataloguePathIds) {
    if (pathId === catalogueId('10', 2)) {
      continue
    }

    yield* sql`INSERT INTO path_questions (qualification_path_id,document_id,question_id) SELECT ${pathId},q.document_id,q.id FROM written_questions q WHERE q.id IN ${sql.in(questions.map((_, index) => catalogueId('30', index + 1)))} ON CONFLICT DO NOTHING`
  }
})
