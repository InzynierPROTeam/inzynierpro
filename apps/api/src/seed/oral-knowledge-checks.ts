import type { KnowledgeCheckFormat } from '@inzpro/domain/modules/learning-content/oral-knowledge-check'
import { RichContent, richContentVersion } from '@inzpro/rich-content/rich-content'
import { Effect, Schema } from 'effect'
import { SqlClient } from 'effect/sql'

import { catalogueId } from './catalogue-id.js'
import { plain } from './rich-text.js'

type SeedKnowledgeCheck = {
  readonly questionNumber: number
  readonly oralRevisionId: string
  readonly format: KnowledgeCheckFormat
  readonly prompt: string
  readonly options: ReadonlyArray<readonly [text: string, isCorrect: boolean]>
  readonly explanation: string
}

const initialOralRevision = (questionNumber: number) => catalogueId('34', questionNumber)

const knowledgeChecks: ReadonlyArray<SeedKnowledgeCheck> = [
  {
    questionNumber: 1,
    oralRevisionId: initialOralRevision(1),
    format: 'single_choice',
    prompt: 'Która część nie należy do projektu budowlanego według art. 34 ust. 3?',
    options: [
      ['Projekt wykonawczy', true],
      ['Projekt zagospodarowania działki lub terenu', false],
      ['Projekt techniczny', false],
    ],
    explanation:
      'Art. 34 ust. 3 Prawa budowlanego wymienia projekt zagospodarowania działki lub terenu, projekt architektoniczno-budowlany i projekt techniczny. Projekt wykonawczy do nich nie należy.',
  },
  {
    questionNumber: 2,
    oralRevisionId: initialOralRevision(2),
    format: 'true_false',
    prompt:
      'Decyzja o pozwoleniu na budowę wygasa wyłącznie wtedy, gdy budowy nie rozpoczęto przed upływem 3 lat.',
    options: [
      ['Prawda', true],
      ['Fałsz', false],
    ],
    explanation:
      'To pytanie sprawdza wcześniejszą wersję opracowania, która nie wymieniała przerwy w budowie.',
  },
  {
    questionNumber: 2,
    oralRevisionId: catalogueId('35', 2),
    format: 'multiple_choice',
    prompt: 'W jakich przypadkach decyzja o pozwoleniu na budowę wygasa?',
    options: [
      [
        'Budowy nie rozpoczęto przed upływem 3 lat od dnia, w którym decyzja stała się ostateczna',
        true,
      ],
      ['Budowę przerwano na czas dłuższy niż 3 lata', true],
      ['Inwestor zmienił kierownika budowy', false],
      ['Upłynął rok od dnia wydania decyzji', false],
    ],
    explanation:
      'Art. 37 ust. 1 Prawa budowlanego przewiduje dwa przypadki: budowa nie została rozpoczęta przed upływem 3 lat albo została przerwana na czas dłuższy niż 3 lata.',
  },
  {
    questionNumber: 3,
    oralRevisionId: initialOralRevision(3),
    format: 'true_false',
    prompt: 'Organ ma 21 dni na wniesienie sprzeciwu od zgłoszenia.',
    options: [
      ['Prawda', true],
      ['Fałsz', false],
    ],
    explanation:
      'Na wniesienie sprzeciwu od zgłoszenia organ ma 21 dni, a na wydanie decyzji o pozwoleniu na budowę 65 dni.',
  },
  {
    questionNumber: 4,
    oralRevisionId: initialOralRevision(4),
    format: 'single_choice',
    prompt:
      'Ile dni ma organ nadzoru budowlanego na sprzeciw po zawiadomieniu o zakończeniu budowy?',
    options: [
      ['14 dni', true],
      ['21 dni', false],
      ['30 dni', false],
    ],
    explanation:
      'Zgodnie z art. 54 Prawa budowlanego do użytkowania można przystąpić, jeżeli organ w terminie 14 dni nie zgłosi sprzeciwu.',
  },
]

const explanationJson = (text: string) =>
  Schema.decodeEffect(RichContent)({
    version: richContentVersion,
    doc: { type: 'doc', content: [{ type: 'paragraph', content: [plain(text)] }] },
  }).pipe(Effect.map(content => JSON.stringify(content)))

export const seedOralKnowledgeChecks = Effect.fn('seedOralKnowledgeChecks')(function* () {
  const sql = yield* SqlClient.SqlClient

  for (const [index, check] of knowledgeChecks.entries()) {
    const checkNumber = index + 1
    const checkId = catalogueId('36', checkNumber)
    const revisionId = catalogueId('37', checkNumber)
    const questionId = catalogueId('33', check.questionNumber)
    const explanation = yield* explanationJson(check.explanation)

    yield* sql`INSERT INTO oral_knowledge_checks (id,question_id) VALUES (${checkId},${questionId}) ON CONFLICT DO NOTHING`
    yield* sql`INSERT INTO oral_knowledge_check_revisions (id,knowledge_check_id,question_id,oral_revision_id,format,prompt,explanation)
    VALUES (${revisionId},${checkId},${questionId},${check.oralRevisionId},${check.format},${check.prompt},${explanation}::jsonb) ON CONFLICT DO NOTHING`

    for (const [optionIndex, [text, isCorrect]] of check.options.entries()) {
      const optionId = catalogueId('38', checkNumber * 10 + optionIndex + 1)

      yield* sql`INSERT INTO oral_knowledge_check_options (id,knowledge_check_revision_id,option_position,text,is_correct)
      SELECT ${optionId},r.id,${optionIndex + 1},${text},${isCorrect} FROM oral_knowledge_check_revisions r WHERE r.id=${revisionId} AND r.published_at IS NULL
      ON CONFLICT DO NOTHING`
    }

    yield* sql`UPDATE oral_knowledge_check_revisions SET published_at=clock_timestamp() WHERE id=${revisionId} AND published_at IS NULL`
    yield* sql`UPDATE oral_knowledge_checks SET current_revision_id=${revisionId} WHERE id=${checkId} AND current_revision_id IS NULL`
  }
})
