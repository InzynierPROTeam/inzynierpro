import {
  cosmeticChange,
  substantiveChange,
} from '~api/modules/learning-content/domain/learning-content.model.js'

import { catalogueId } from './catalogue-id.js'
import { bold, italic, plain } from './rich-text.js'

// EXTERNAL: Sources: Prawo budowlane https://eli.gov.pl/api/acts/DU/2024/725/text.html (art. 17, 18, 24, 37, 82) and warunki techniczne https://eli.gov.pl/api/acts/DU/2022/1225/text.pdf (§ 62, 68, 72, 298).
export const buildingLaw = catalogueId('20', 1)

export const technicalConditions = catalogueId('20', 2)

export const questions = [
  {
    documentId: buildingLaw,
    body: 'Która z wymienionych osób jest uczestnikiem procesu budowlanego w rozumieniu Prawa budowlanego?',
    answers: ['Projektant', 'Rzeczoznawca majątkowy', 'Pośrednik w obrocie nieruchomościami'],
    explanation: [
      italic('Art. 17 Prawa budowlanego'),
      plain(' zalicza '),
      bold('projektanta'),
      plain(' do uczestników procesu budowlanego.'),
    ],
  },
  {
    documentId: buildingLaw,
    body: 'Czy na tej samej budowie można łączyć funkcję kierownika budowy i inspektora nadzoru inwestorskiego?',
    answers: [
      'Nie, łączenie tych funkcji jest niedopuszczalne.',
      'Tak, za zgodą inwestora.',
      'Tak, jeżeli budowa dotyczy budynku jednorodzinnego.',
    ],
    explanation: [
      italic('Art. 24 ust. 1 Prawa budowlanego'),
      plain(' zabrania '),
      bold('łączenia funkcji'),
      plain(' kierownika budowy i inspektora nadzoru inwestorskiego.'),
    ],
  },
  {
    documentId: technicalConditions,
    body: 'Jaka jest minimalna wysokość balustrady, mierzona do wierzchu poręczy, w budynku jednorodzinnym?',
    answers: ['0,9 m', '0,7 m', '0,8 m'],
    explanation: [
      plain('Zgodnie z tabelą w '),
      italic('§ 298 ust. 2 warunków technicznych'),
      plain(' minimalna wysokość balustrady w budynkach jednorodzinnych wynosi '),
      bold('0,9 m'),
      plain('.'),
    ],
  },
  {
    documentId: buildingLaw,
    body: 'Kto zapewnia ustanowienie inspektora nadzoru inwestorskiego, jeżeli jest on wymagany?',
    answers: ['Inwestor', 'Kierownik budowy', 'Projektant'],
    explanation: [
      italic('Art. 18 ust. 1 Prawa budowlanego'),
      plain(' nakłada na '),
      bold('inwestora'),
      plain(
        ' obowiązek zapewnienia ustanowienia inspektora nadzoru inwestorskiego, jeżeli jest on wymagany.',
      ),
    ],
  },
  {
    documentId: buildingLaw,
    body: 'Kiedy wygasa decyzja o pozwoleniu na budowę, jeżeli budowy nie rozpoczęto?',
    answers: [
      'Po upływie 3 lat od dnia, w którym decyzja stała się ostateczna.',
      'Po upływie 2 lat od dnia wydania decyzji.',
      'Po upływie 5 lat od dnia, w którym decyzja stała się ostateczna.',
    ],
    explanation: [
      italic('Art. 37 ust. 1 Prawa budowlanego'),
      plain(': decyzja wygasa, jeżeli budowa nie została rozpoczęta przed upływem '),
      bold('3 lat'),
      plain(' od dnia, w którym stała się ostateczna.'),
    ],
  },
  {
    documentId: buildingLaw,
    body: 'Który organ jest co do zasady organem administracji architektoniczno-budowlanej pierwszej instancji?',
    answers: ['Starosta', 'Wojewoda', 'Wójt gminy'],
    explanation: [
      italic('Art. 82 ust. 2 Prawa budowlanego'),
      plain(
        ' powierza zadania organu administracji architektoniczno-budowlanej pierwszej instancji ',
      ),
      bold('staroście'),
      plain('.'),
    ],
  },
  {
    documentId: technicalConditions,
    body: 'Jaka jest minimalna szerokość drzwi wejściowych do budynku w świetle ościeżnicy?',
    answers: ['0,9 m', '0,8 m', '1,2 m'],
    explanation: [
      italic('§ 62 ust. 1 warunków technicznych'),
      plain(
        ' wymaga, aby drzwi wejściowe do budynku miały w świetle ościeżnicy szerokość co najmniej ',
      ),
      bold('0,9 m'),
      plain('.'),
    ],
  },
  {
    documentId: technicalConditions,
    body: 'Jaka jest minimalna szerokość użytkowa biegu schodów w budynku mieszkalnym jednorodzinnym?',
    answers: ['0,8 m', '0,9 m', '1,2 m'],
    explanation: [
      plain('Tabela w '),
      italic('§ 68 ust. 1 warunków technicznych'),
      plain(' określa minimalną szerokość użytkową biegu w budynku jednorodzinnym na '),
      bold('0,8 m'),
      plain('.'),
    ],
  },
  {
    documentId: technicalConditions,
    body: 'Jaka jest maksymalna wysokość stopni schodów w budynku mieszkalnym jednorodzinnym?',
    answers: ['0,19 m', '0,175 m', '0,22 m'],
    explanation: [
      plain('Tabela w '),
      italic('§ 68 ust. 1 warunków technicznych'),
      plain(' dopuszcza w budynku jednorodzinnym stopnie o wysokości do '),
      bold('0,19 m'),
      plain('.'),
    ],
  },
  {
    documentId: technicalConditions,
    body: 'Jaka jest co do zasady minimalna wysokość w świetle pomieszczeń przeznaczonych na stały pobyt ludzi?',
    answers: ['2,5 m', '2,2 m', '2,8 m'],
    explanation: [
      italic('§ 72 ust. 1 warunków technicznych'),
      plain(' wymaga co do zasady wysokości w świetle co najmniej '),
      bold('2,5 m'),
      plain(' dla pomieszczeń przeznaczonych na stały pobyt ludzi.'),
    ],
  },
]

// EXTERNAL: Source for the substantive revision: Prawo budowlane, art. 37 ust. 1.
export const laterRevisions = [
  {
    questionNumber: 6,
    changeKind: cosmeticChange,
    body: 'Który organ jest, co do zasady, organem administracji architektoniczno-budowlanej pierwszej instancji?',
    answers: ['Starosta', 'Wojewoda', 'Wójt gminy'],
    explanation: [
      italic('Art. 82 ust. 2 Prawa budowlanego'),
      plain(
        ' powierza zadania organu administracji architektoniczno-budowlanej pierwszej instancji ',
      ),
      bold('staroście'),
      plain('.'),
    ],
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
    explanation: [
      italic('Art. 37 ust. 1 Prawa budowlanego'),
      plain(': decyzja wygasa również wtedy, gdy budowa została '),
      bold('przerwana na czas dłuższy niż 3 lata'),
      plain('.'),
    ],
  },
] as const
