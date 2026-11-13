import { POLAND_TIME_ZONE, POLISH_LANGUAGE } from '@inzpro/config/localization'
import { unrestrictedQualificationScopeCode } from '@inzpro/domain/modules/qualification-paths/qualification-scope'
import { demolitionSpecializationCode } from '@inzpro/domain/modules/qualification-paths/specialization'
import { DateTime, Effect } from 'effect'
import { SqlClient } from 'effect/sql'

// Local development catalogue with Polish display names and authored example questions.
// Published chamber dates and explicitly unconfirmed planning estimates live in catalogue.ts.
// Stable IDs make repeated explicit seeding safe; existing revisions are never rewritten.
import {
  catalogueId,
  catalogueSpecializations,
  catalogueKinds,
  catalogueScopes,
  catalogueSessions,
} from './catalogue.js'

export const seedTechnicalCatalogue = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql.withTransaction(
    Effect.gen(function* () {
      yield* sql`INSERT INTO general_chambers (id, name) VALUES
        ('50000000-0000-4000-8000-000000000001','Polska Izba Inżynierów Budownictwa'),
        ('50000000-0000-4000-8000-000000000002','Izba Architektów Rzeczypospolitej Polskiej') ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name`

      for (const entry of catalogueSpecializations) {
        yield* sql`INSERT INTO specializations (id,code,name,description,general_chamber_id) VALUES (${entry.id},${entry.code},${entry.name},${entry.description},${entry.chamberId}) ON CONFLICT (id) DO UPDATE SET code=EXCLUDED.code,name=EXCLUDED.name,description=EXCLUDED.description,general_chamber_id=EXCLUDED.general_chamber_id`
      }

      for (const entry of catalogueKinds) {
        yield* sql`INSERT INTO qualification_kinds (id,code,name) VALUES (${entry.id},${entry.code},${entry.name}) ON CONFLICT (id) DO UPDATE SET code=EXCLUDED.code,name=EXCLUDED.name`
      }

      for (const entry of catalogueScopes) {
        yield* sql`INSERT INTO qualification_scopes (id,code,name) VALUES (${entry.id},${entry.code},${entry.name}) ON CONFLICT (id) DO UPDATE SET code=EXCLUDED.code,name=EXCLUDED.name`
      }

      for (const entry of catalogueSessions) {
        // The published day is represented at Warsaw midnight; no examination hour is invented.
        const written = DateTime.makeZonedUnsafe(`${entry.day}T00:00:00`, {
          timeZone: POLAND_TIME_ZONE,
          adjustForTimeZone: true,
        })

        const writtenAt = DateTime.formatIso(written)
        const oralPlanningAt = DateTime.formatIso(DateTime.add(written, { days: 14 }))
        const selectionClosesAt = DateTime.formatIso(DateTime.add(written, { days: 60 }))
        yield* sql`INSERT INTO exam_sessions (id,general_chamber_id,name,written_at,is_confirmed,oral_planning_at,selection_closes_at,published) VALUES (${entry.id},${entry.chamberId},${entry.name},${writtenAt},${entry.isConfirmed},${oralPlanningAt},${selectionClosesAt},true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,written_at=EXCLUDED.written_at,is_confirmed=EXCLUDED.is_confirmed,oral_planning_at=EXCLUDED.oral_planning_at,selection_closes_at=EXCLUDED.selection_closes_at,published=EXCLUDED.published`
      }

      const cataloguePathIds: string[] = []
      let pathNumber = 3

      for (const specialization of catalogueSpecializations) {
        for (const kind of catalogueKinds) {
          for (const scope of catalogueScopes) {
            if (
              specialization.code === demolitionSpecializationCode &&
              scope.code !== unrestrictedQualificationScopeCode
            ) {
              continue
            }

            let id: string

            if (
              specialization.id === catalogueId('60', 1) &&
              kind.id === catalogueId('70', 1) &&
              scope.id === catalogueId('80', 1)
            ) {
              id = catalogueId('10', 1)
            } else if (
              specialization.id === catalogueId('60', 2) &&
              kind.id === catalogueId('70', 2) &&
              scope.id === catalogueId('80', 2)
            ) {
              id = catalogueId('10', 2)
            } else {
              id = catalogueId('10', pathNumber++)
            }

            cataloguePathIds.push(id)
            const name = `${specialization.name}${specialization.description === null ? '' : ` (${specialization.description})`} — ${kind.pathLabel} ${scope.name.toLocaleLowerCase(POLISH_LANGUAGE)}`
            yield* sql`INSERT INTO qualification_paths (id,name,specialization_id,qualification_kind_id,qualification_scope_id,published) VALUES (${id},${name},${specialization.id},${kind.id},${scope.id},true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,published=EXCLUDED.published`
          }
        }
      }

      yield* sql`INSERT INTO reference_documents (id, title) VALUES
      ('20000000-0000-4000-8000-000000000001', 'Ustawa z dnia 7 lipca 1994 r. — Prawo budowlane'),
      ('20000000-0000-4000-8000-000000000002', 'Warunki techniczne, jakim powinny odpowiadać budynki i ich usytuowanie') ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title`
      yield* sql`INSERT INTO path_documents (qualification_path_id, document_id) VALUES
      ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001'),
      ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002'),
      ('10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001') ON CONFLICT DO NOTHING`

      for (const pathId of cataloguePathIds) {
        if (pathId === catalogueId('10', 2)) {
          continue
        }

        for (const documentId of [catalogueId('20', 1), catalogueId('20', 2)]) {
          yield* sql`INSERT INTO path_documents (qualification_path_id,document_id) VALUES (${pathId},${documentId}) ON CONFLICT DO NOTHING`
        }
      }

      // Sources: https://eli.gov.pl/api/acts/DU/2024/725/text.html (art. 17, 24)
      // https://eli.gov.pl/api/acts/DU/2022/1225/text.pdf (§ 298 ust. 2).
      const questions = [
        {
          body: 'Która z wymienionych osób jest uczestnikiem procesu budowlanego w rozumieniu Prawa budowlanego?',
          answers: ['Projektant', 'Rzeczoznawca majątkowy', 'Pośrednik w obrocie nieruchomościami'],
          explanation:
            'Art. 17 Prawa budowlanego zalicza projektanta do uczestników procesu budowlanego.',
        },
        {
          body: 'Czy na tej samej budowie można łączyć funkcję kierownika budowy i inspektora nadzoru inwestorskiego?',
          answers: [
            'Nie, łączenie tych funkcji jest niedopuszczalne.',
            'Tak, za zgodą inwestora.',
            'Tak, jeżeli budowa dotyczy budynku jednorodzinnego.',
          ],
          explanation:
            'Art. 24 ust. 1 Prawa budowlanego zabrania łączenia funkcji kierownika budowy i inspektora nadzoru inwestorskiego.',
        },
        {
          body: 'Jaka jest minimalna wysokość balustrady, mierzona do wierzchu poręczy, w budynku jednorodzinnym?',
          answers: ['0,9 m', '0,7 m', '0,8 m'],
          explanation:
            'Zgodnie z tabelą w § 298 ust. 2 warunków technicznych minimalna wysokość balustrady w budynkach jednorodzinnych wynosi 0,9 m.',
        },
      ]

      for (const [questionIndex, question] of questions.entries()) {
        const n = questionIndex + 1
        const questionId = `30000000-0000-4000-8000-00000000000${n}`
        const revisionId = `43000000-0000-4000-8000-00000000000${n}`
        const documentId = `20000000-0000-4000-8000-00000000000${n === 3 ? 2 : 1}`
        yield* sql`INSERT INTO written_questions (id, document_id) VALUES (${questionId}, ${documentId}) ON CONFLICT DO NOTHING`
        yield* sql`INSERT INTO question_revisions (id,question_id,body,explanation)
        VALUES (${revisionId},${questionId},${question.body},${question.explanation}) ON CONFLICT DO NOTHING`

        const revisions =
          yield* sql`SELECT published_at FROM question_revisions WHERE id=${revisionId} LIMIT 1`

        if (revisions[0]?.publishedAt === null) {
          for (const [index, text] of question.answers.entries()) {
            const answerNumber = index + 1
            const answerId = `44000000-0000-4000-8000-0000000000${n}${answerNumber}`
            const isCorrect = index === 0
            yield* sql`INSERT INTO question_answers (id,question_revision_id,text,is_correct) VALUES (${answerId},${revisionId},${text},${isCorrect}) ON CONFLICT DO NOTHING`
          }

          yield* sql`UPDATE question_revisions SET published_at=clock_timestamp() WHERE id=${revisionId}`
        }

        yield* sql`UPDATE written_questions SET current_revision_id = ${revisionId} WHERE id = ${questionId} AND (current_revision_id IS NULL OR current_revision_id = ${`41000000-0000-4000-8000-00000000000${n}`})`
        yield* sql`INSERT INTO path_questions (qualification_path_id, document_id, question_id)
        VALUES ('10000000-0000-4000-8000-000000000001', ${documentId}, ${questionId}) ON CONFLICT DO NOTHING`
      }

      // Both paths share the first question and its published revision.
      yield* sql`INSERT INTO path_questions (qualification_path_id, document_id, question_id)
      VALUES ('10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001',
      '30000000-0000-4000-8000-000000000001') ON CONFLICT DO NOTHING`

      for (const pathId of cataloguePathIds) {
        if (pathId === catalogueId('10', 2)) {
          continue
        }

        yield* sql`INSERT INTO path_questions (qualification_path_id,document_id,question_id) SELECT ${pathId},q.document_id,q.id FROM written_questions q WHERE q.id IN (${catalogueId('30', 1)},${catalogueId('30', 2)},${catalogueId('30', 3)}) ON CONFLICT DO NOTHING`
      }
    }),
  )
})
