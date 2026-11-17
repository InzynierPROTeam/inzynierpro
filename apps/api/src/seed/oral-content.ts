import { type Block } from '@inzpro/rich-content/rich-content'

import { bold, italic, plain } from './rich-text.js'
import { paragraph } from './rich-text.js'
import { heading } from './rich-text.js'
import { bulletList } from './rich-text.js'
import { orderedList } from './rich-text.js'
import { table } from './rich-text.js'
// EXTERNAL: Sources: Prawo budowlane https://eli.gov.pl/api/acts/DU/2024/725/text.html (art. 17, 20, 22, 29–30, 34, 35, 37, 54) and warunki techniczne https://eli.gov.pl/api/acts/DU/2022/1225/text.pdf (§ 12, 62, 68, 72, 298).

export const questions: ReadonlyArray<{
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

export const substantiveRevision = {
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
