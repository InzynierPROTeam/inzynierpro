import { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import {
  cosmeticChange,
  substantiveChange,
} from '~api/modules/learning-content/domain/learning-content.model.js'

import { catalogueId } from './catalogue-id.js'
import { stairRiserHeightAssetId } from './content-assets.js'
import { bold, italic, plain } from './rich-text.js'

// EXTERNAL: Sources: Prawo budowlane https://eli.gov.pl/api/acts/DU/2024/725/text.html (art. 17, 18, 24, 37, 41, 45, 62, 82) and warunki techniczne https://eli.gov.pl/api/acts/DU/2022/1225/text.pdf (§ 12, 57, 62, 68, 72, 298).
export const buildingLaw = ReferenceDocumentId.make(catalogueId('20', 1))

export const technicalConditions = ReferenceDocumentId.make(catalogueId('20', 2))

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
    figure: {
      assetId: stairRiserHeightAssetId,
      alt: 'Przekrój biegu schodów z zaznaczoną wysokością jednego stopnia',
      caption: 'Rys. 1. Wysokość stopnia w przekroju biegu schodów',
    },
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
  {
    documentId: buildingLaw,
    body: 'Z jaką chwilą następuje rozpoczęcie budowy?',
    answers: [
      'Z chwilą podjęcia prac przygotowawczych na terenie budowy.',
      'Z chwilą, w której decyzja o pozwoleniu na budowę stała się ostateczna.',
      'Z chwilą wykonania fundamentów obiektu budowlanego.',
    ],
    explanation: [
      italic('Art. 41 ust. 1 Prawa budowlanego'),
      plain(': rozpoczęcie budowy następuje z chwilą podjęcia '),
      bold('prac przygotowawczych'),
      plain(' na terenie budowy.'),
    ],
  },
  {
    documentId: buildingLaw,
    body: 'Który dokument stanowi urzędowy dokument przebiegu robót budowlanych?',
    answers: ['Dziennik budowy', 'Książka obiektu budowlanego', 'Projekt techniczny'],
    explanation: [
      italic('Art. 45 ust. 1 Prawa budowlanego'),
      plain(': '),
      bold('dziennik budowy'),
      plain(' stanowi urzędowy dokument przebiegu robót budowlanych.'),
    ],
  },
  {
    documentId: buildingLaw,
    body: 'Jak często należy co najmniej przeprowadzać okresową kontrolę stanu technicznego i przydatności do użytkowania obiektu budowlanego, obejmującą także estetykę obiektu i jego otoczenia?',
    answers: ['Raz na 5 lat', 'Raz na 10 lat', 'Raz na 3 lata'],
    explanation: [
      italic('Art. 62 ust. 1 pkt 2 Prawa budowlanego'),
      plain(' wymaga takiej kontroli co najmniej '),
      bold('raz na 5 lat'),
      plain('.'),
    ],
  },
  {
    documentId: technicalConditions,
    body: 'W jakiej minimalnej odległości od granicy działki budowlanej sytuuje się co do zasady budynek zwrócony w jej stronę ścianą z oknami lub drzwiami?',
    answers: ['4 m', '3 m', '5 m'],
    explanation: [
      italic('§ 12 ust. 1 pkt 1 warunków technicznych'),
      plain(': budynek zwrócony ścianą z oknami lub drzwiami sytuuje się co najmniej '),
      bold('4 m'),
      plain(' od granicy działki.'),
    ],
  },
  {
    documentId: technicalConditions,
    body: 'W jakiej minimalnej odległości od granicy działki budowlanej sytuuje się co do zasady budynek zwrócony w jej stronę ścianą bez okien i drzwi?',
    answers: ['3 m', '1,5 m', '4 m'],
    explanation: [
      italic('§ 12 ust. 1 pkt 2 warunków technicznych'),
      plain(': budynek zwrócony ścianą bez okien i drzwi sytuuje się co najmniej '),
      bold('3 m'),
      plain(' od granicy działki.'),
    ],
  },
  {
    documentId: technicalConditions,
    body: 'Jaki powinien być co najmniej stosunek powierzchni okien, liczonej w świetle ościeżnic, do powierzchni podłogi w pomieszczeniu przeznaczonym na stały pobyt ludzi?',
    answers: ['1:8', '1:12', '1:5'],
    explanation: [
      italic('§ 57 ust. 1 warunków technicznych'),
      plain(' wymaga stosunku powierzchni okien do powierzchni podłogi co najmniej '),
      bold('1:8'),
      plain('.'),
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
