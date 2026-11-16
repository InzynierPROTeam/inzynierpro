import { POLAND_TIME_ZONE, POLISH_LANGUAGE } from '@inzpro/config/localization'
import { unrestrictedQualificationScopeCode } from '@inzpro/domain/modules/qualification-paths/qualification-scope'
import { demolitionSpecializationCode } from '@inzpro/domain/modules/qualification-paths/specialization'
import { DateTime, Effect } from 'effect'
import { SqlClient } from 'effect/sql'
import {
  cosmeticChange,
  initialRevision,
  substantiveChange,
} from '~api/modules/learning-content/domain/learning-content.model.js'

// Local development catalogue with Polish display names and authored example questions.
// Published chamber dates and explicitly unconfirmed planning estimates live in catalogue.ts.
// Stable IDs make repeated explicit seeding safe; existing revisions are never rewritten.
import {
  catalogueDistrictChambers,
  catalogueGeneralChambers,
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
      for (const entry of catalogueGeneralChambers) {
        yield* sql`INSERT INTO general_chambers (id,code,name,short_name) VALUES (${entry.id},${entry.code},${entry.name},${entry.shortName}) ON CONFLICT (id) DO UPDATE SET code=EXCLUDED.code,name=EXCLUDED.name,short_name=EXCLUDED.short_name`
      }

      for (const entry of catalogueDistrictChambers) {
        yield* sql`INSERT INTO district_chambers (id,general_chamber_id,code,name,short_name,sort_order,published) VALUES (${entry.id},${entry.generalChamberId},${entry.code},${entry.name},${entry.shortName},${entry.sortOrder},true) ON CONFLICT (id) DO UPDATE SET general_chamber_id=EXCLUDED.general_chamber_id,code=EXCLUDED.code,name=EXCLUDED.name,short_name=EXCLUDED.short_name,sort_order=EXCLUDED.sort_order,published=EXCLUDED.published`
      }

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

      // Sources: Prawo budowlane https://eli.gov.pl/api/acts/DU/2024/725/text.html (art. 17, 18,
      // 24, 37, 82) and warunki techniczne https://eli.gov.pl/api/acts/DU/2022/1225/text.pdf
      // (§ 62, 68, 72, 298). The first option of each question is correct.
      const buildingLaw = catalogueId('20', 1)
      const technicalConditions = catalogueId('20', 2)

      const questions = [
        {
          documentId: buildingLaw,
          body: 'Która z wymienionych osób jest uczestnikiem procesu budowlanego w rozumieniu Prawa budowlanego?',
          answers: ['Projektant', 'Rzeczoznawca majątkowy', 'Pośrednik w obrocie nieruchomościami'],
          explanation:
            'Art. 17 Prawa budowlanego zalicza projektanta do uczestników procesu budowlanego.',
        },
        {
          documentId: buildingLaw,
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
          documentId: technicalConditions,
          body: 'Jaka jest minimalna wysokość balustrady, mierzona do wierzchu poręczy, w budynku jednorodzinnym?',
          answers: ['0,9 m', '0,7 m', '0,8 m'],
          explanation:
            'Zgodnie z tabelą w § 298 ust. 2 warunków technicznych minimalna wysokość balustrady w budynkach jednorodzinnych wynosi 0,9 m.',
        },
        {
          documentId: buildingLaw,
          body: 'Kto zapewnia ustanowienie inspektora nadzoru inwestorskiego, jeżeli jest on wymagany?',
          answers: ['Inwestor', 'Kierownik budowy', 'Projektant'],
          explanation:
            'Art. 18 ust. 1 Prawa budowlanego nakłada na inwestora obowiązek zapewnienia ustanowienia inspektora nadzoru inwestorskiego, jeżeli jest on wymagany.',
        },
        {
          documentId: buildingLaw,
          body: 'Kiedy wygasa decyzja o pozwoleniu na budowę, jeżeli budowy nie rozpoczęto?',
          answers: [
            'Po upływie 3 lat od dnia, w którym decyzja stała się ostateczna.',
            'Po upływie 2 lat od dnia wydania decyzji.',
            'Po upływie 5 lat od dnia, w którym decyzja stała się ostateczna.',
          ],
          explanation:
            'Art. 37 ust. 1 Prawa budowlanego: decyzja wygasa, jeżeli budowa nie została rozpoczęta przed upływem 3 lat od dnia, w którym stała się ostateczna.',
        },
        {
          documentId: buildingLaw,
          body: 'Który organ jest co do zasady organem administracji architektoniczno-budowlanej pierwszej instancji?',
          answers: ['Starosta', 'Wojewoda', 'Wójt gminy'],
          explanation:
            'Art. 82 ust. 2 Prawa budowlanego powierza zadania organu administracji architektoniczno-budowlanej pierwszej instancji staroście.',
        },
        {
          documentId: technicalConditions,
          body: 'Jaka jest minimalna szerokość drzwi wejściowych do budynku w świetle ościeżnicy?',
          answers: ['0,9 m', '0,8 m', '1,2 m'],
          explanation:
            '§ 62 ust. 1 warunków technicznych wymaga, aby drzwi wejściowe do budynku miały w świetle ościeżnicy szerokość co najmniej 0,9 m.',
        },
        {
          documentId: technicalConditions,
          body: 'Jaka jest minimalna szerokość użytkowa biegu schodów w budynku mieszkalnym jednorodzinnym?',
          answers: ['0,8 m', '0,9 m', '1,2 m'],
          explanation:
            'Tabela w § 68 ust. 1 warunków technicznych określa minimalną szerokość użytkową biegu w budynku jednorodzinnym na 0,8 m.',
        },
        {
          documentId: technicalConditions,
          body: 'Jaka jest maksymalna wysokość stopni schodów w budynku mieszkalnym jednorodzinnym?',
          answers: ['0,19 m', '0,175 m', '0,22 m'],
          explanation:
            'Tabela w § 68 ust. 1 warunków technicznych dopuszcza w budynku jednorodzinnym stopnie o wysokości do 0,19 m.',
        },
        {
          documentId: technicalConditions,
          body: 'Jaka jest co do zasady minimalna wysokość w świetle pomieszczeń przeznaczonych na stały pobyt ludzi?',
          answers: ['2,5 m', '2,2 m', '2,8 m'],
          explanation:
            '§ 72 ust. 1 warunków technicznych wymaga co do zasady wysokości w świetle co najmniej 2,5 m dla pomieszczeń przeznaczonych na stały pobyt ludzi.',
        },
      ]

      for (const [questionIndex, question] of questions.entries()) {
        const n = questionIndex + 1
        const questionId = catalogueId('30', n)
        const revisionId = catalogueId('43', n)
        const { documentId } = question
        yield* sql`INSERT INTO written_questions (id, document_id) VALUES (${questionId}, ${documentId}) ON CONFLICT DO NOTHING`
        yield* sql`INSERT INTO question_revisions (id,question_id,body,explanation,change_kind,substantive_revision_id)
        VALUES (${revisionId},${questionId},${question.body},${question.explanation},${initialRevision},${revisionId}) ON CONFLICT DO NOTHING`

        const revisions =
          yield* sql`SELECT published_at FROM question_revisions WHERE id=${revisionId} LIMIT 1`

        if (revisions[0]?.publishedAt === null) {
          for (const [index, text] of question.answers.entries()) {
            const answerId = catalogueId('44', n * 10 + index + 1)
            const isCorrect = index === 0
            yield* sql`INSERT INTO question_answers (id,question_revision_id,text,is_correct) VALUES (${answerId},${revisionId},${text},${isCorrect}) ON CONFLICT DO NOTHING`
          }

          yield* sql`UPDATE question_revisions SET published_at=clock_timestamp() WHERE id=${revisionId}`
        }

        yield* sql`UPDATE written_questions SET current_revision_id = ${revisionId} WHERE id = ${questionId} AND (current_revision_id IS NULL OR current_revision_id = ${catalogueId('41', n)})`
        yield* sql`INSERT INTO path_questions (qualification_path_id, document_id, question_id)
        VALUES ('10000000-0000-4000-8000-000000000001', ${documentId}, ${questionId}) ON CONFLICT DO NOTHING`
      }

      // Later revisions show how a change kind affects coverage (ADR-0003): a cosmetic comma fix
      // keeps the question covered in the current round, a changed question uncovers it. Source for
      // the substantive one: art. 37 ust. 1 Prawa budowlanego. The first option is correct.
      const laterRevisions = [
        {
          questionNumber: 6,
          changeKind: cosmeticChange,
          body: 'Który organ jest, co do zasady, organem administracji architektoniczno-budowlanej pierwszej instancji?',
          answers: ['Starosta', 'Wojewoda', 'Wójt gminy'],
          explanation:
            'Art. 82 ust. 2 Prawa budowlanego powierza zadania organu administracji architektoniczno-budowlanej pierwszej instancji staroście.',
        },
        {
          questionNumber: 5,
          changeKind: substantiveChange,
          body: 'Kiedy wygasa decyzja o pozwoleniu na budowę, jeżeli rozpoczętą budowę przerwano?',
          answers: [
            'Gdy budowa została przerwana na czas dłuższy niż 3 lata.',
            'Gdy budowa została przerwana na czas dłuższy niż 2 lata.',
            'Przerwa w budowie nie powoduje wygaśnięcia decyzji.',
          ],
          explanation:
            'Art. 37 ust. 1 Prawa budowlanego: decyzja wygasa również wtedy, gdy budowa została przerwana na czas dłuższy niż 3 lata.',
        },
      ] as const

      for (const revision of laterRevisions) {
        const n = revision.questionNumber
        const questionId = catalogueId('30', n)
        const previousId = catalogueId('43', n)
        const revisionId = catalogueId('45', n)

        const substantiveRevisionId =
          revision.changeKind === cosmeticChange ? previousId : revisionId

        yield* sql`INSERT INTO question_revisions (id,question_id,body,explanation,change_kind,substantive_revision_id)
        VALUES (${revisionId},${questionId},${revision.body},${revision.explanation},${revision.changeKind},${substantiveRevisionId}) ON CONFLICT DO NOTHING`

        const revisions =
          yield* sql`SELECT published_at FROM question_revisions WHERE id=${revisionId} LIMIT 1`

        if (revisions[0]?.publishedAt === null) {
          for (const [index, text] of revision.answers.entries()) {
            const answerId = catalogueId('46', n * 10 + index + 1)
            const isCorrect = index === 0
            yield* sql`INSERT INTO question_answers (id,question_revision_id,text,is_correct) VALUES (${answerId},${revisionId},${text},${isCorrect}) ON CONFLICT DO NOTHING`
          }

          yield* sql`UPDATE question_revisions SET published_at=clock_timestamp() WHERE id=${revisionId}`
        }

        yield* sql`UPDATE written_questions SET current_revision_id=${revisionId} WHERE id=${questionId} AND current_revision_id=${previousId}`
      }

      // The second path is small enough to finish its learning round by hand in a few minutes. It
      // shares its Building Law questions and their revisions with the first path.
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
    }),
  )
})
