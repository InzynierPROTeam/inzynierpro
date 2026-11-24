import { type Block, RichContent, richContentVersion } from '@inzpro/rich-content/rich-content'
import { Effect, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import {
  initialRevision,
  substantiveChange,
} from '~api/modules/learning-content/domain/learning-content.model.js'

import { catalogueId } from './catalogue-id.js'
import { questions, substantiveRevision } from './oral-content.js'
import { seedOralKnowledgeChecks } from './oral-knowledge-checks.js'
import { seedOralRegionalLinks } from './oral-regional-links.js'
import {
  oralQuestionReferences,
  oralSubstantiveRevisionReferences,
  seedQuestionReferences,
} from './question-references.js'
import { plain } from './rich-text.js'
import { paragraph } from './rich-text.js'

const contentJson = (blocks: ReadonlyArray<Block>) =>
  Schema.decodeEffect(RichContent)({
    version: richContentVersion,
    doc: { type: 'doc', content: blocks },
  }).pipe(Effect.map(content => JSON.stringify(content)))

const pathWithoutOralMaterial = catalogueId('10', 1)

const categories = [
  { id: catalogueId('32', 1), name: 'Proces inwestycyjny i pozwolenie na budowę' },
  { id: catalogueId('32', 2), name: 'Uczestnicy procesu budowlanego' },
  { id: catalogueId('32', 3), name: 'Warunki techniczne w projektowaniu' },
] as const

export const seedOralCatalogue = Effect.fn('seedOralCatalogue')(function* (
  pathIds: ReadonlyArray<string>,
) {
  const sql = yield* SqlClient.SqlClient
  const oralPathIds = pathIds.filter(pathId => pathId !== pathWithoutOralMaterial)

  for (const [index, category] of categories.entries()) {
    yield* sql`INSERT INTO oral_question_categories (id,name,sort_order) VALUES (${category.id},${category.name},${index + 1}) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,sort_order=EXCLUDED.sort_order`
  }

  const positions = new Map<number, number>()

  for (const [questionIndex, entry] of questions.entries()) {
    const questionNumber = questionIndex + 1
    const questionId = catalogueId('33', questionNumber)
    const revisionId = catalogueId('34', questionNumber)
    const categoryId = catalogueId('32', entry.category)
    const position = (positions.get(entry.category) ?? 0) + 1
    positions.set(entry.category, position)

    const body = yield* contentJson([paragraph(plain(entry.question))])
    const answer = yield* contentJson(entry.answer)

    yield* sql`INSERT INTO oral_questions (id,category_id,category_position) VALUES (${questionId},${categoryId},${position}) ON CONFLICT DO NOTHING`
    yield* sql`INSERT INTO oral_revisions (id,question_id,body,answer,change_kind,substantive_revision_id)
    VALUES (${revisionId},${questionId},${body}::jsonb,${answer}::jsonb,${initialRevision},${revisionId}) ON CONFLICT DO NOTHING`

    const revisions =
      yield* sql`SELECT published_at FROM oral_revisions WHERE id=${revisionId} LIMIT 1`

    if (revisions[0]?.publishedAt === null) {
      yield* seedQuestionReferences(
        { oralRevisionId: revisionId },
        oralQuestionReferences[questionIndex] ?? [],
      )
      yield* sql`UPDATE oral_revisions SET published_at=clock_timestamp() WHERE id=${revisionId}`
    }

    yield* sql`UPDATE oral_questions SET current_revision_id=${revisionId} WHERE id=${questionId} AND current_revision_id IS NULL`

    for (const pathId of oralPathIds) {
      yield* sql`INSERT INTO path_oral_questions (qualification_path_id,question_id) VALUES (${pathId},${questionId}) ON CONFLICT DO NOTHING`
    }
  }

  const { questionNumber } = substantiveRevision
  const questionId = catalogueId('33', questionNumber)
  const previousId = catalogueId('34', questionNumber)
  const revisionId = catalogueId('35', questionNumber)
  const body = yield* contentJson([paragraph(plain(substantiveRevision.question))])
  const answer = yield* contentJson(substantiveRevision.answer)

  yield* sql`INSERT INTO oral_revisions (id,question_id,body,answer,change_kind,substantive_revision_id)
  VALUES (${revisionId},${questionId},${body}::jsonb,${answer}::jsonb,${substantiveChange},${revisionId}) ON CONFLICT DO NOTHING`

  const substantiveRevisions =
    yield* sql`SELECT published_at FROM oral_revisions WHERE id=${revisionId} LIMIT 1`

  if (substantiveRevisions[0]?.publishedAt === null) {
    yield* seedQuestionReferences({ oralRevisionId: revisionId }, oralSubstantiveRevisionReferences)
    yield* sql`UPDATE oral_revisions SET published_at=clock_timestamp() WHERE id=${revisionId}`
  }

  yield* sql`UPDATE oral_questions SET current_revision_id=${revisionId} WHERE id=${questionId} AND current_revision_id=${previousId}`

  yield* seedOralKnowledgeChecks()
  yield* seedOralRegionalLinks()
})
