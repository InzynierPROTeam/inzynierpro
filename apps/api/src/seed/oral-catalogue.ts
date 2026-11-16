import {
  type Block,
  RichContent,
  richContentVersion,
  type TableCell,
  type Text,
} from '@inzpro/rich-content/rich-content'
import { Effect, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import {
  initialRevision,
  substantiveChange,
} from '~api/modules/learning-content/domain/learning-content.model.js'

import { catalogueId } from './catalogue.js'
import { seedOralKnowledgeChecks } from './oral-knowledge-checks.js'
import { seedOralRegionalLinks } from './oral-regional-links.js'
import { bold, italic, plain } from './rich-text.js'

// EXTERNAL: Sources: Prawo budowlane https://eli.gov.pl/api/acts/DU/2024/725/text.html (art. 17, 20, 22, 29–30, 34, 35, 37, 54) and warunki techniczne https://eli.gov.pl/api/acts/DU/2022/1225/text.pdf (§ 12, 62, 68, 72, 298).

const paragraph = (...content: ReadonlyArray<Text>): Block => ({ type: 'paragraph', content })

const heading = (value: string): Block => ({
  type: 'heading',
  attrs: { level: 3 },
  content: [plain(value)],
})

const listItems = (items: ReadonlyArray<ReadonlyArray<Text>>) =>
  items.map(item => ({ type: 'listItem' as const, content: [paragraph(...item)] }))

const bulletList = (...items: ReadonlyArray<ReadonlyArray<Text>>): Block => ({
  type: 'bulletList',
  content: listItems(items),
})

const orderedList = (...items: ReadonlyArray<ReadonlyArray<Text>>): Block => ({
  type: 'orderedList',
  content: listItems(items),
})

const cell = (type: TableCell['type'], value: string): TableCell => ({
  type,
  content: [paragraph(plain(value))],
})

const table = (
  header: ReadonlyArray<string>,
  ...rows: ReadonlyArray<ReadonlyArray<string>>
): Block => ({
  type: 'table',
  content: [
    { type: 'tableRow', content: header.map(value => cell('tableHeader', value)) },
    ...rows.map(row => ({
      type: 'tableRow' as const,
      content: row.map(value => cell('tableCell', value)),
    })),
  ],
})

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

const questions: ReadonlyArray<{
  readonly category: number
  readonly question: string
  readonly answer: ReadonlyArray<Block>
}> = [
  {
    category: 1,
    question: 'Z jakich części składa się projekt budowlany?',
    answer: [
      heading('Części projektu budowlanego'),
      paragraph(
        italic('Art. 34 ust. 3 Prawa budowlanego'),
        plain(' wymienia trzy części projektu:'),
      ),
      bulletList(
        [bold('projekt zagospodarowania działki lub terenu'), plain(',')],
        [bold('projekt architektoniczno-budowlany'), plain(',')],
        [bold('projekt techniczny'), plain('.')],
      ),
      heading('Dokumenty towarzyszące'),
      paragraph(
        plain(
          'Do projektu dołącza się wymagane opinie, uzgodnienia, pozwolenia i inne dokumenty, a także oświadczenia o ich dostępności.',
        ),
      ),
    ],
  },
  {
    category: 1,
    question: 'Kiedy wygasa decyzja o pozwoleniu na budowę?',
    answer: [
      heading('Wygaśnięcie decyzji'),
      paragraph(
        italic('Art. 37 ust. 1 Prawa budowlanego'),
        plain(': decyzja wygasa, jeżeli budowa nie została rozpoczęta przed upływem '),
        bold('3 lat'),
        plain(' od dnia, w którym decyzja stała się ostateczna.'),
      ),
    ],
  },
  {
    category: 1,
    question: 'Czym różni się pozwolenie na budowę od zgłoszenia?',
    answer: [
      heading('Porównanie trybów'),
      table(
        ['Cecha', 'Pozwolenie na budowę', 'Zgłoszenie'],
        ['Forma rozstrzygnięcia', 'Decyzja administracyjna', 'Milczące przyjęcie albo sprzeciw'],
        ['Termin organu', '65 dni na wydanie decyzji', '21 dni na wniesienie sprzeciwu'],
        ['Podstawa', 'Art. 28 i 35', 'Art. 29 i 30'],
      ),
      paragraph(
        plain('Zgłoszenie stosuje się do robót wymienionych w '),
        italic('art. 29'),
        plain('; pozostałe roboty wymagają co do zasady pozwolenia na budowę.'),
      ),
    ],
  },
  {
    category: 1,
    question: 'Kiedy można przystąpić do użytkowania obiektu budowlanego?',
    answer: [
      heading('Zawiadomienie o zakończeniu budowy'),
      paragraph(
        plain('Zgodnie z '),
        italic('art. 54 Prawa budowlanego'),
        plain(
          ' do użytkowania można przystąpić po zawiadomieniu organu nadzoru budowlanego, jeżeli organ w terminie ',
        ),
        bold('14 dni'),
        plain(' nie zgłosi sprzeciwu.'),
      ),
      heading('Kolejne kroki'),
      orderedList(
        [plain('Zakończenie robót i skompletowanie dokumentacji powykonawczej.')],
        [
          plain(
            'Zawiadomienie organu albo wniosek o pozwolenie na użytkowanie, gdy jest wymagane.',
          ),
        ],
        [plain('Upływ terminu na sprzeciw albo ostateczne pozwolenie na użytkowanie.')],
      ),
    ],
  },
  {
    category: 2,
    question: 'Kto jest uczestnikiem procesu budowlanego?',
    answer: [
      heading('Uczestnicy według art. 17'),
      bulletList(
        [plain('inwestor,')],
        [plain('inspektor nadzoru inwestorskiego,')],
        [plain('projektant,')],
        [plain('kierownik budowy lub kierownik robót.')],
      ),
      paragraph(
        plain('Funkcji kierownika budowy i inspektora nadzoru inwestorskiego nie wolno łączyć ('),
        italic('art. 24 ust. 1'),
        plain(').'),
      ),
    ],
  },
  {
    category: 2,
    question: 'Jakie są podstawowe obowiązki projektanta?',
    answer: [
      heading('Obowiązki z art. 20 ust. 1'),
      bulletList(
        [plain('opracowanie projektu zgodnie z przepisami i zasadami wiedzy technicznej,')],
        [plain('zapewnienie sprawdzenia projektu przez osobę z odpowiednimi uprawnieniami,')],
        [plain('uzyskanie wymaganych opinii, uzgodnień i sprawdzeń,')],
        [
          plain('sprawowanie '),
          bold('nadzoru autorskiego'),
          plain(' na żądanie inwestora lub organu.'),
        ],
      ),
    ],
  },
  {
    category: 2,
    question: 'Na czym polega nadzór autorski?',
    answer: [
      heading('Zakres nadzoru autorskiego'),
      paragraph(plain('Projektant sprawujący nadzór autorski w toku robót:')),
      bulletList(
        [plain('stwierdza zgodność realizacji z projektem,')],
        [
          plain(
            'uzgadnia możliwość wprowadzenia rozwiązań zamiennych zgłoszonych przez kierownika budowy.',
          ),
        ],
      ),
      paragraph(
        plain('Nadzór autorski jest sprawowany na żądanie inwestora lub właściwego organu.'),
      ),
    ],
  },
  {
    category: 2,
    question: 'Jakie są podstawowe obowiązki kierownika budowy?',
    answer: [
      heading('Obowiązki z art. 22'),
      orderedList(
        [plain('protokolarne przejęcie terenu budowy od inwestora,')],
        [plain('prowadzenie dokumentacji budowy,')],
        [plain('zorganizowanie budowy i kierowanie nią zgodnie z projektem i przepisami,')],
        [plain('zgłaszanie obiektu do odbioru i udział w czynnościach odbiorowych.')],
      ),
    ],
  },
  {
    category: 3,
    question: 'W jakiej odległości od granicy działki można sytuować budynek?',
    answer: [
      heading('Odległości według § 12'),
      table(
        ['Ściana budynku zwrócona w stronę granicy', 'Najmniejsza odległość'],
        ['z oknami lub drzwiami', '4 m'],
        ['bez okien i drzwi', '3 m'],
      ),
      paragraph(
        plain(
          'Przepis dopuszcza w określonych przypadkach sytuowanie budynku bliżej granicy albo bezpośrednio przy niej.',
        ),
      ),
    ],
  },
  {
    category: 3,
    question: 'Jakie wymagania dotyczą schodów w budynku mieszkalnym jednorodzinnym?',
    answer: [
      heading('Wymiary schodów i balustrad'),
      table(
        ['Wymaganie', 'Wartość', 'Podstawa'],
        ['Minimalna szerokość użytkowa biegu', '0,8 m', '§ 68 ust. 1'],
        ['Maksymalna wysokość stopnia', '0,19 m', '§ 68 ust. 1'],
        ['Minimalna wysokość balustrady', '0,9 m', '§ 298 ust. 2'],
      ),
    ],
  },
  {
    category: 3,
    question: 'Jakie wymagania dotyczą drzwi wejściowych do budynku?',
    answer: [
      heading('Wymiary w świetle ościeżnicy'),
      paragraph(
        italic('§ 62 ust. 1 warunków technicznych'),
        plain(' wymaga, aby drzwi wejściowe miały co najmniej '),
        bold('0,9 m'),
        plain(' szerokości i '),
        bold('2 m'),
        plain(' wysokości w świetle ościeżnicy.'),
      ),
    ],
  },
  {
    category: 3,
    question: 'Jaka jest wymagana wysokość pomieszczeń przeznaczonych na stały pobyt ludzi?',
    answer: [
      heading('Zasada ogólna'),
      paragraph(
        italic('§ 72 warunków technicznych'),
        plain(' wymaga co do zasady wysokości w świetle co najmniej '),
        bold('2,5 m'),
        plain('.'),
      ),
      heading('Odstępstwa'),
      paragraph(
        plain(
          'Przepis określa niższe wartości dla niektórych pomieszczeń, na przykład na poddaszu, gdzie wysokość odnosi się do części powierzchni pomieszczenia.',
        ),
      ),
    ],
  },
]

const substantiveRevision = {
  questionNumber: 2,
  question: 'Kiedy wygasa decyzja o pozwoleniu na budowę?',
  answer: [
    heading('Wygaśnięcie decyzji'),
    paragraph(italic('Art. 37 ust. 1 Prawa budowlanego'), plain(' przewiduje dwa przypadki:')),
    orderedList(
      [
        plain('budowa nie została rozpoczęta przed upływem '),
        bold('3 lat'),
        plain(' od dnia, w którym decyzja stała się ostateczna,'),
      ],
      [plain('budowa została przerwana na czas dłuższy niż '), bold('3 lata'), plain('.')],
    ),
  ],
} as const

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
    yield* sql`UPDATE oral_revisions SET published_at=clock_timestamp() WHERE id=${revisionId} AND published_at IS NULL`
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

  yield* sql`INSERT INTO oral_revisions (id,question_id,body,answer,change_kind,substantive_revision_id,published_at)
  VALUES (${revisionId},${questionId},${body}::jsonb,${answer}::jsonb,${substantiveChange},${revisionId},clock_timestamp()) ON CONFLICT DO NOTHING`
  yield* sql`UPDATE oral_questions SET current_revision_id=${revisionId} WHERE id=${questionId} AND current_revision_id=${previousId}`

  yield* seedOralKnowledgeChecks()
  yield* seedOralRegionalLinks()
})
