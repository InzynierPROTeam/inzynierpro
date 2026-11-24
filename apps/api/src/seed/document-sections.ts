import type { Block } from '@inzpro/rich-content/rich-content'

import { stairRiserHeightAssetId } from './content-assets.js'
import { paragraph, plain, table } from './rich-text.js'

export type SeedSection = {
  readonly address: string
  readonly parentAddress: string | null
  readonly title: string | null
  readonly content: ReadonlyArray<Block> | null
}

const text = (value: string) => [paragraph(plain(value))]

const chapter = (address: string, title: string): SeedSection => ({
  address,
  parentAddress: null,
  title,
  content: null,
})

const unit = (
  address: string,
  parentAddress: string | null,
  content: ReadonlyArray<Block> | null = null,
): SeedSection => ({ address, parentAddress, title: null, content })

const textUnit = (address: string, parentAddress: string, value: string) =>
  unit(address, parentAddress, text(value))

// EXTERNAL: Adapted from Prawo budowlane, Dz.U. 2024 poz. 725 (t.j.), https://eli.gov.pl/api/acts/DU/2024/725/text.html; shortened to the units the seeded questions use and lightly paraphrased.
export const buildingLawSections: ReadonlyArray<SeedSection> = [
  chapter('rozdz:3', 'Prawa i obowiązki uczestników procesu budowlanego'),
  textUnit('art:17', 'rozdz:3', 'Uczestnikami procesu budowlanego, w rozumieniu ustawy, są:'),
  textUnit('art:17/pkt:1', 'art:17', 'inwestor;'),
  textUnit('art:17/pkt:2', 'art:17', 'inspektor nadzoru inwestorskiego;'),
  textUnit('art:17/pkt:3', 'art:17', 'projektant;'),
  textUnit('art:17/pkt:4', 'art:17', 'kierownik budowy lub kierownik robót.'),
  unit('art:18', 'rozdz:3'),
  textUnit(
    'art:18/ust:1',
    'art:18',
    'Inwestor, z uwzględnieniem wymagań wynikających z przepisów, ustaleń i decyzji, jest obowiązany zorganizować proces budowy, z uwzględnieniem zawartych w przepisach zasad bezpieczeństwa i ochrony zdrowia, a w szczególności zapewnić:',
  ),
  textUnit(
    'art:18/ust:1/pkt:1',
    'art:18/ust:1',
    'opracowanie projektu budowlanego i, stosownie do potrzeb, innych projektów;',
  ),
  textUnit(
    'art:18/ust:1/pkt:2',
    'art:18/ust:1',
    'objęcie kierownictwa budowy przez kierownika budowy;',
  ),
  textUnit(
    'art:18/ust:1/pkt:3',
    'art:18/ust:1',
    'opracowanie planu bezpieczeństwa i ochrony zdrowia;',
  ),
  textUnit('art:18/ust:1/pkt:4', 'art:18/ust:1', 'wykonanie i odbiór robót budowlanych;'),
  textUnit(
    'art:18/ust:1/pkt:5',
    'art:18/ust:1',
    'ustanowienie inspektora nadzoru inwestorskiego, jeżeli jest on wymagany.',
  ),
  unit('art:20', 'rozdz:3'),
  textUnit('art:20/ust:1', 'art:20', 'Do podstawowych obowiązków projektanta należy:'),
  textUnit(
    'art:20/ust:1/pkt:1',
    'art:20/ust:1',
    'opracowanie projektu budowlanego w sposób zgodny z wymaganiami ustawy, ustaleniami określonymi w decyzjach administracyjnych dotyczących zamierzenia budowlanego, obowiązującymi przepisami oraz zasadami wiedzy technicznej;',
  ),
  textUnit(
    'art:20/ust:1/pkt:4',
    'art:20/ust:1',
    'sprawowanie nadzoru autorskiego na żądanie inwestora lub właściwego organu.',
  ),
  textUnit('art:22', 'rozdz:3', 'Do podstawowych obowiązków kierownika budowy należy:'),
  textUnit(
    'art:22/pkt:1',
    'art:22',
    'protokolarne przejęcie od inwestora i odpowiednie zabezpieczenie terenu budowy wraz ze znajdującymi się na nim obiektami budowlanymi, urządzeniami technicznymi i stałymi punktami osnowy geodezyjnej;',
  ),
  textUnit('art:22/pkt:3', 'art:22', 'prowadzenie dokumentacji budowy;'),
  textUnit(
    'art:22/pkt:4',
    'art:22',
    'zapewnienie geodezyjnego wytyczenia obiektu oraz zorganizowanie budowy i kierowanie budową obiektu budowlanego w sposób zgodny z projektem lub pozwoleniem na budowę.',
  ),
  unit('art:24', 'rozdz:3'),
  textUnit(
    'art:24/ust:1',
    'art:24',
    'Nie wolno łączyć funkcji kierownika budowy lub kierownika robót i inspektora nadzoru inwestorskiego.',
  ),
  chapter('rozdz:4', 'Postępowanie poprzedzające rozpoczęcie robót budowlanych'),
  unit('art:28', 'rozdz:4'),
  textUnit(
    'art:28/ust:1',
    'art:28',
    'Roboty budowlane można rozpocząć jedynie na podstawie decyzji o pozwoleniu na budowę, z zastrzeżeniem art. 29–31.',
  ),
  unit('art:29', 'rozdz:4'),
  textUnit(
    'art:29/ust:1',
    'art:29',
    'Nie wymaga decyzji o pozwoleniu na budowę, a wymaga zgłoszenia, o którym mowa w art. 30, budowa:',
  ),
  textUnit(
    'art:29/ust:1/pkt:1',
    'art:29/ust:1',
    'wolno stojących budynków mieszkalnych jednorodzinnych, których obszar oddziaływania mieści się w całości na działce lub działkach, na których zostały zaprojektowane.',
  ),
  unit('art:30', 'rozdz:4'),
  textUnit(
    'art:30/ust:5',
    'art:30',
    'Do wykonywania robót budowlanych można przystąpić, jeżeli organ administracji architektoniczno-budowlanej, w terminie 21 dni od dnia doręczenia zgłoszenia, nie wniesie, w drodze decyzji, sprzeciwu.',
  ),
  unit('art:34', 'rozdz:4'),
  textUnit('art:34/ust:3', 'art:34', 'Projekt budowlany obejmuje:'),
  textUnit('art:34/ust:3/pkt:1', 'art:34/ust:3', 'projekt zagospodarowania działki lub terenu;'),
  textUnit('art:34/ust:3/pkt:2', 'art:34/ust:3', 'projekt architektoniczno-budowlany;'),
  textUnit('art:34/ust:3/pkt:3', 'art:34/ust:3', 'projekt techniczny.'),
  unit('art:35', 'rozdz:4'),
  textUnit(
    'art:35/ust:1',
    'art:35',
    'Przed wydaniem decyzji o pozwoleniu na budowę organ administracji architektoniczno-budowlanej sprawdza:',
  ),
  textUnit(
    'art:35/ust:1/pkt:1',
    'art:35/ust:1',
    'zgodność projektu zagospodarowania działki lub terenu oraz projektu architektoniczno-budowlanego z ustaleniami miejscowego planu zagospodarowania przestrzennego albo decyzji o warunkach zabudowy i zagospodarowania terenu.',
  ),
  unit('art:37', 'rozdz:4'),
  textUnit(
    'art:37/ust:1',
    'art:37',
    'Decyzja o pozwoleniu na budowę wygasa, jeżeli budowa nie została rozpoczęta przed upływem 3 lat od dnia, w którym decyzja ta stała się ostateczna, lub budowa została przerwana na czas dłuższy niż 3 lata.',
  ),
  chapter('rozdz:5', 'Rozpoczęcie i prowadzenie robót budowlanych'),
  unit('art:41', 'rozdz:5'),
  textUnit(
    'art:41/ust:1',
    'art:41',
    'Rozpoczęcie budowy następuje z chwilą podjęcia prac przygotowawczych na terenie budowy.',
  ),
  textUnit('art:41/ust:2', 'art:41', 'Pracami przygotowawczymi są:'),
  textUnit('art:41/ust:2/pkt:1', 'art:41/ust:2', 'wytyczenie geodezyjne obiektów w terenie;'),
  textUnit('art:41/ust:2/pkt:2', 'art:41/ust:2', 'wykonanie niwelacji terenu;'),
  textUnit(
    'art:41/ust:2/pkt:3',
    'art:41/ust:2',
    'zagospodarowanie terenu budowy wraz z budową tymczasowych obiektów;',
  ),
  textUnit(
    'art:41/ust:2/pkt:4',
    'art:41/ust:2',
    'wykonanie przyłączy do sieci infrastruktury technicznej na potrzeby budowy.',
  ),
  textUnit(
    'art:45',
    'rozdz:5',
    'W przypadku robót budowlanych wymagających ustanowienia kierownika budowy prowadzi się dziennik budowy zgodnie z przepisami rozdziału 5a.',
  ),
  chapter('rozdz:5c', 'Zakończenie budowy'),
  unit('art:54', 'rozdz:5c'),
  textUnit(
    'art:54/ust:1',
    'art:54',
    'Do użytkowania obiektu budowlanego, na którego wzniesienie jest wymagane pozwolenie na budowę, można przystąpić po zawiadomieniu organu nadzoru budowlanego o zakończeniu budowy, jeżeli organ ten, w terminie 14 dni od dnia doręczenia zawiadomienia, nie zgłosi sprzeciwu w drodze decyzji.',
  ),
  chapter('rozdz:6', 'Utrzymanie obiektów budowlanych'),
  unit('art:62', 'rozdz:6'),
  textUnit(
    'art:62/ust:1',
    'art:62',
    'Obiekty budowlane powinny być w czasie ich użytkowania poddawane przez właściciela lub zarządcę kontroli:',
  ),
  textUnit(
    'art:62/ust:1/pkt:1',
    'art:62/ust:1',
    'okresowej, co najmniej raz w roku, polegającej na sprawdzeniu stanu technicznego:',
  ),
  textUnit(
    'art:62/ust:1/pkt:1/lit:a',
    'art:62/ust:1/pkt:1',
    'elementów budynku, budowli i instalacji narażonych na szkodliwe wpływy atmosferyczne i niszczące działania czynników występujących podczas użytkowania obiektu,',
  ),
  textUnit(
    'art:62/ust:1/pkt:1/lit:b',
    'art:62/ust:1/pkt:1',
    'instalacji i urządzeń służących ochronie środowiska,',
  ),
  textUnit(
    'art:62/ust:1/pkt:1/lit:c',
    'art:62/ust:1/pkt:1',
    'instalacji gazowych oraz przewodów kominowych;',
  ),
  textUnit(
    'art:62/ust:1/pkt:2',
    'art:62/ust:1',
    'okresowej, co najmniej raz na 5 lat, polegającej na sprawdzeniu stanu technicznego i przydatności do użytkowania obiektu budowlanego, estetyki obiektu budowlanego oraz jego otoczenia.',
  ),
  chapter('rozdz:8', 'Organy administracji architektoniczno-budowlanej i nadzoru budowlanego'),
  unit('art:82', 'rozdz:8'),
  textUnit(
    'art:82/ust:2',
    'art:82',
    'Organem administracji architektoniczno-budowlanej pierwszej instancji, z zastrzeżeniem ust. 3 i 4, jest starosta.',
  ),
]

// EXTERNAL: Adapted from the technical conditions regulation, Dz.U. 2022 poz. 1225 (t.j.), https://eli.gov.pl/api/acts/DU/2022/1225/text.pdf; shortened to the units the seeded questions use and lightly paraphrased.
export const technicalConditionsSections: ReadonlyArray<SeedSection> = [
  unit('par:12', null),
  textUnit(
    'par:12/ust:1',
    'par:12',
    'Jeżeli z przepisów rozporządzenia lub przepisów odrębnych nie wynikają inne wymagania, budynek na działce budowlanej sytuuje się w odległości od granicy z sąsiednią działką budowlaną nie mniejszej niż:',
  ),
  textUnit(
    'par:12/ust:1/pkt:1',
    'par:12/ust:1',
    '4 m – w przypadku budynku zwróconego ścianą z oknami lub drzwiami w stronę tej granicy;',
  ),
  textUnit(
    'par:12/ust:1/pkt:2',
    'par:12/ust:1',
    '3 m – w przypadku budynku zwróconego ścianą bez okien i drzwi w stronę tej granicy.',
  ),
  unit('par:57', null),
  textUnit(
    'par:57/ust:1',
    'par:57',
    'W pomieszczeniu przeznaczonym na pobyt ludzi należy zapewnić oświetlenie dzienne. Stosunek powierzchni okien, liczonej w świetle ościeżnic, do powierzchni podłogi powinien wynosić co najmniej 1:8.',
  ),
  unit('par:62', null),
  textUnit(
    'par:62/ust:1',
    'par:62',
    'Drzwi wejściowe do budynku powinny mieć w świetle ościeżnicy szerokość co najmniej 0,9 m i wysokość 2 m.',
  ),
  unit('par:68', null),
  unit('par:68/ust:1', 'par:68', [
    paragraph(
      plain(
        'Szerokość użytkowa biegów schodów stałych oraz spoczników, a także maksymalna wysokość stopni tych schodów, w zależności od przeznaczenia budynku, powinny odpowiadać wartościom podanym w tabeli:',
      ),
    ),
    table(
      [
        'Rodzaj budynku',
        'Minimalna szerokość użytkowa biegu (m)',
        'Minimalna szerokość spocznika (m)',
        'Maksymalna wysokość stopni (m)',
      ],
      ['Mieszkalne jednorodzinne', '0,8', '0,8', '0,19'],
      ['Mieszkalne wielorodzinne', '1,2', '1,3', '0,175'],
      ['Garaże wbudowane i wolno stojące (indywidualne)', '0,8', '0,8', '0,2'],
    ),
    {
      type: 'image',
      attrs: {
        assetId: stairRiserHeightAssetId,
        alt: 'Przekrój biegu schodów z zaznaczoną wysokością stopnia',
        caption: 'Wysokość stopnia mierzona między powierzchniami sąsiednich stopni',
      },
    },
  ]),
  unit('par:72', null),
  textUnit(
    'par:72/ust:1',
    'par:72',
    'Wysokość pomieszczeń przeznaczonych na stały pobyt ludzi, w świetle, powinna wynosić co najmniej 3 m, z zastrzeżeniem przepisów rozporządzenia dotyczących budynków mieszkalnych jednorodzinnych i pomieszczeń o mniejszej liczbie zatrudnionych.',
  ),
  unit('par:298', null),
  textUnit(
    'par:298/ust:2',
    'par:298',
    'Balustrady przy schodach i pochylniach w budynkach mieszkalnych jednorodzinnych powinny mieć wysokość co najmniej 0,9 m, mierząc do wierzchu poręczy.',
  ),
]
