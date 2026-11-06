> Archiwum pierwotnego zarysu przekazanego przez użytkownika. To materiał historyczny: późniejsze decyzje z wywiadu zastąpiły część propozycji. Aktualny zakres wskazuje [mapa specyfikacji](../specifications.md). Nie używaj tego pliku jako zlecenia implementacji.

# InżynierPRO V2 — Kompletny kontekst produktu i architektury

**Wersja:** 0.7  
**Data:** 4 listopada 2026  
**Status:** Projekt koncepcyjny — przed implementacją

---

# 1. Charakterystyka produktu

InżynierPRO to platforma edukacyjna przeznaczona do przygotowania do egzaminów na uprawnienia budowlane w Polsce.

Platforma obsługuje dwie izby:

- **PIIB** — Polska Izba Inżynierów Budownictwa.
- **IARP** — Izba Architektów Rzeczypospolitej Polskiej.

Docelowy zakres obejmuje wszystkie ścieżki uprawnień dostępne w obu izbach, z uwzględnieniem różnic w specjalnościach, rodzajach uprawnień, zakresach oraz zasadach egzaminacyjnych.

Główne obszary produktu:

- Przygotowanie do egzaminu pisemnego.
- Przygotowanie do egzaminu ustnego.
- Nauka pytań egzaminacyjnych.
- Opracowania odpowiedzi.
- Egzaminy próbne.
- System powtórek.
- Analiza postępów.
- Gamifikacja.
- Dostęp do dokumentów źródłowych wymaganych podczas przygotowań.
- Generowanie materiałów do pobrania i wydrukowania.
- Zgłaszanie błędów i przekazywanie pytań zapamiętanych po egzaminie.

Istniejąca wersja produktu jest określana jako V1.

**V2 jest całkowicie nową implementacją rozwijaną w odrębnym repozytorium.**

Architektura, backend, model danych i aplikacje powstają od podstaw.

V1 pozostaje źródłem:

- Identyfikacji wizualnej.
- Doświadczeń produktowych.
- Rozwiązań UX.
- Istniejących pytań i opracowań.
- Informacji o potrzebach użytkowników.
- Wiedzy o domenie egzaminacyjnej.

Struktura techniczna V1 nie jest wzorcem architektonicznym V2.

---

# 2. Wizja produktu

InżynierPRO V2 ma być nowoczesną platformą edukacyjną łączącą skuteczną naukę, uporządkowaną wiedzę egzaminacyjną, gamifikację i zaawansowane mechanizmy utrzymywania poprawności materiałów.

Początkowo produkt koncentruje się na nauce.

W dłuższej perspektywie możliwa jest ewolucja w kierunku platformy community-driven, w której użytkownicy aktywnie współtworzą i aktualizują bazę wiedzy.

Docelowa społeczność może:

- Dodawać i proponować nowe pytania.
- Zgłaszać błędy w istniejących materiałach.
- Proponować poprawki pytań i odpowiedzi.
- Opracowywać odpowiedzi ustne.
- Recenzować i weryfikować materiały.
- Pomagać aktualizować wiedzę po zmianach przepisów.
- Tworzyć artykuły, bazę wiedzy i FAQ.
- Uczestniczyć w moderacji i utrzymywaniu jakości.
- Zdobywać punkty, reputację, odznaki i potencjalne nagrody.

Automatyzacja ma ograniczać pracę operacyjną, zwłaszcza przy:

- Monitorowaniu dokumentów źródłowych.
- Analizie zmian prawnych.
- Wykrywaniu nieaktualnych materiałów.
- Organizowaniu zadań redakcyjnych.
- Wspieraniu recenzji.
- Przeliczaniu rankingów.
- Publikowaniu zatwierdzonych treści.

Długoterminowym założeniem jest platforma funkcjonująca przy minimalnym codziennym zaangażowaniu właściciela, przy zachowaniu odpowiedzialności za decyzje krytyczne, bezpieczeństwo i finanse.

**Aplikacja do nauki jest samodzielnym produktem.**

Rezygnacja z uruchomienia Community nie uniemożliwia dalszego działania ani rozwoju platformy.

Model biznesowy również pozostaje niezależny od podstawowych mechanizmów edukacyjnych.

Produkt może pozostać darmowy albo w przyszłości przejść na model freemium, płatny lub mieszany.

---

# 3. Główne decyzje

| Obszar                | Ustalenie                                                     |
| --------------------- | ------------------------------------------------------------- |
| Repozytorium          | Nowe monorepo od zera                                         |
| V1                    | Inspiracja wizualna i źródło treści, nie wzorzec architektury |
| Izby                  | PIIB i IARP                                                   |
| Ścieżki               | Wszystkie jako zakres docelowy                                |
| Konto                 | Obowiązkowe                                                   |
| Model początkowy      | Całkowicie darmowa nauka                                      |
| Model przyszły        | Możliwość wprowadzenia płatnego dostępu                       |
| Offline               | Brak w MVP                                                    |
| Historia nauki        | Oddzielna dla każdej ścieżki uprawnień                        |
| Gamifikacja           | Od pierwszego wydania                                         |
| Ustny                 | Opracowania, samoocena i adaptacyjne mini-quizy               |
| Community             | Późniejszy etap                                               |
| Work Management       | Od MVP, początkowo wewnętrzny                                 |
| Pytania po egzaminie  | Zbieranie od MVP                                              |
| Feedback po egzaminie | Wynik, zapamiętane pytania, NPS i inne ankiety                |
| Admin Panel           | Niski priorytet początkowy; pełny panel później               |
| Backend               | TypeScript i Effect v4                                        |
| Architektura          | Modular Monolith i Clean Architecture                         |
| Organizacja backendu  | Moduły z własnymi warstwami oraz wspólna infrastruktura       |
| Baza danych           | PostgreSQL                                                    |
| SQL                   | Effect SQL, w szczególności `@effect/sql-pg`                  |
| Redis                 | Auth/session, rate limiting, cache                            |
| Search                | PostgreSQL Full Text Search                                   |
| Background jobs       | Trwałe zadania w tle                                          |
| Website               | Astro                                                         |
| Web Platform          | TanStack Start                                                |
| Admin                 | TanStack Start                                                |
| Mobile                | React Native i Expo                                           |
| Monorepo              | pnpm i Turborepo                                              |
| IaC                   | Alchemy                                                       |
| i18n                  | Tylko Admin                                                   |
| AI coding             | Matt Pocock Skills i deterministyczne guardrails              |
| Naming/folder rules   | Własne reguły lint                                            |
| Dokumenty prawne      | Zatwierdzane wydania, z późniejszą automatyzacją konsolidacji |

---

# 4. Organizacja aplikacji

## 4.1. Public Website

**Technologia: Astro**

Publiczna witryna obejmuje:

- Stronę główną.
- Opis produktu.
- Materiały informacyjne.
- Blog.
- Bazę wiedzy.
- FAQ.
- Treści SEO.
- Informacje o egzaminach.
- Informacje o sponsorach.
- Możliwości dobrowolnego finansowania platformy.
- Ewentualne publiczne rankingi.

Docelowo artykuły oraz FAQ mogą być tworzone i utrzymywane przez społeczność przy wykorzystaniu wspólnego procesu redakcyjnego.

## 4.2. Learning Platform

**Technologia: TanStack Start**

Główna aplikacja webowa obejmuje:

- Logowanie i profil.
- Onboarding.
- Wybór ścieżki uprawnień.
- Wybór sesji egzaminacyjnej.
- Dashboard.
- Naukę pisemną.
- Naukę ustną.
- Egzaminy próbne.
- Powtórki.
- Statystyki.
- Gamifikację.
- Przeglądarkę dokumentów.
- Zgłaszanie błędów.
- Przekazywanie pytań zapamiętanych po egzaminie.
- Ankiety i feedback po egzaminie.

W przyszłości Community staje się integralną częścią Learning Platform.

Zgłoszenie błędu, zaproponowanie poprawki czy dodanie pytania odbywa się bezpośrednio w kontekście nauki.

## 4.3. Mobile

**Technologia: React Native + Expo**

Aplikacja mobilna zapewnia główne funkcje edukacyjne oraz dostęp do dokumentów, postępów i gamifikacji.

Nie posiada trybu offline w pierwszym wydaniu.

Przyszłe funkcje Community również mają być zintegrowane z aplikacją mobilną.

## 4.4. Admin Panel

**Technologia: TanStack Start**

Panel administracyjny jest planowaną częścią systemu, ale **nie jest priorytetem podczas początkowego tworzenia repozytorium i aplikacji do nauki**.

Na początku wystarczający jest minimalny przykład funkcji administracyjnej umożliwiający sprawdzenie architektury, RBAC, wzorców kodowania, kontraktów API i podstawowych komponentów.

Pełny panel administracyjny może powstawać później, wraz z rzeczywistymi potrzebami redakcyjnymi i operacyjnymi.

Docelowo obejmuje:

- Zarządzanie użytkownikami.
- Zarządzanie ścieżkami i sesjami.
- Zarządzanie pytaniami i opracowaniami.
- Zarządzanie dokumentami i wykazami.
- Wewnętrzną kolejkę zadań.
- Redakcję i weryfikację materiałów.
- Publikowanie treści.
- Role i uprawnienia.
- Audyt.
- Konfigurację systemu.
- Monitoring procesów redakcyjnych.

### Początkowy priorytet

Pierwszym priorytetem jest Software Factory, architektura backendu oraz działająca aplikacja do nauki.

Panel administracyjny nie stanowi warunku rozpoczęcia rozwoju głównych funkcjonalności.

Wewnętrzne procesy redakcyjne mogą początkowo korzystać z minimalnych narzędzi i interfejsów.

Do uruchomienia MVP obejmującego zgłoszenia użytkowników potrzebny jest dostępny dla uprawnionych osób sposób obsługi kolejki Work Management, lecz nie wymaga to wcześniejszego zbudowania pełnego panelu administracyjnego.

## 4.5. i18n

Tylko panel administracyjny obsługuje i18n.

Learning Platform, Mobile, Public Website i treści edukacyjne są polskojęzyczne.

---

# 5. Konto, onboarding i cykl życia użytkownika

Konto jest wymagane do korzystania z platformy.

Jeden użytkownik może przygotowywać się do wielu ścieżek i kolejnych egzaminów.

## 5.1. Historia nauki per ścieżka

**Historia nauki, postępy, wyniki i stan SRS są rozdzielone według ścieżki uprawnień.**

Każda ścieżka ma własny kontekst edukacyjny użytkownika.

Przykładowo użytkownik może jednocześnie przygotowywać się do dwóch różnych rodzajów uprawnień, posiadając dla każdej ścieżki:

- Oddzielną historię odpowiedzi.
- Oddzielny stan znajomości pytań.
- Oddzielne powtórki.
- Oddzielne statystyki.
- Oddzielne wyniki egzaminów próbnych.
- Oddzielny postęp realizacji materiału.

Zmiana aktywnej ścieżki nie usuwa wcześniejszej historii.

Powrót do ścieżki przywraca jej dotychczasowy stan nauki.

## 5.2. Wspólne pytania pomiędzy ścieżkami

To samo pytanie może występować w kilku ścieżkach.

**Domyślnie postęp dotyczący tego pytania w jednej ścieżce nie jest automatycznie utożsamiany z postępem w innej.**

Możliwy model techniczny obejmuje:

- Wspólną tożsamość i treść pytania.
- Zdarzenia nauki przypisane do użytkownika i ścieżki.
- Stan SRS przypisany do użytkownika, ścieżki i jednostki nauki.

Automatyczne przenoszenie znajomości pytania pomiędzy ścieżkami nie jest ustaloną funkcjonalnością.

Globalne statystyki konta i punkty gamifikacji mogą agregować aktywność z wielu ścieżek, przy zachowaniu rozdzielności ich stanów nauki.

## 5.3. Zmiana sesji egzaminacyjnej

Zmiana sesji w ramach tej samej ścieżki nie powoduje automatycznego usunięcia historii nauki.

Postęp pozostaje powiązany ze ścieżką.

Zmiana oficjalnego zakresu materiałów może jednak wpływać na dostępność pytań, ich wersje i zgodność z nowym wykazem.

Historia wcześniejszych odpowiedzi pozostaje zachowana.

## 5.4. Onboarding

Onboarding obejmuje:

- Wybór izby.
- Wybór specjalności.
- Wybór rodzaju i zakresu uprawnień.
- Wybór docelowej sesji egzaminacyjnej.
- Opcjonalne terminy własnego egzaminu pisemnego i ustnego.
- Dzienny cel nauki.

Oficjalna sesja egzaminacyjna nie jest tym samym co indywidualny termin egzaminu konkretnej osoby.

## 5.5. Cykl życia użytkownika

Główne etapy:

**Przygotowanie → Nauka → Egzamin → Informacja zwrotna → Potencjalny wkład społecznościowy**

Po egzaminie użytkownik może przekazać wynik, ocenę platformy i zapamiętane pytania.

To istotny moment produktu, ponieważ osoba kończąca przygotowania ma świeże doświadczenia, które mogą pomóc kolejnym zdającym.

---

# 6. Examination Domain

Domena egzaminacyjna obejmuje izby, ścieżki uprawnień, sesje i konfiguracje egzaminów.

## 6.1. ExamAuthority

Organizator egzaminu — PIIB albo IARP.

## 6.2. QualificationPath

Konkretna ścieżka uprawnień zdefiniowana przez izbę, specjalność, rodzaj i zakres uprawnień oraz dodatkowe warianty wymagane przez daną izbę.

Konfiguracja nie zakłada identycznego modelu kwalifikacji w PIIB i IARP.

## 6.3. ExamSession

Oficjalna tura egzaminacyjna organizowana przez izbę.

## 6.4. UserExamGoal

Wybrany przez użytkownika cel przygotowania, związany ze ścieżką, sesją i planem nauki.

## 6.5. ExamBlueprint

Wersjonowana konfiguracja egzaminu próbnego, obejmująca liczbę pytań, czas, próg zaliczenia, sposób punktacji i zasady doboru materiałów.

## 6.6. MockExamAttempt

Konkretne podejście użytkownika do egzaminu próbnego.

Zapisuje blueprint oraz dokładne rewizje pytań wykorzystanych w teście.

## 6.7. ExamFeedback

Informacja użytkownika o przebiegu rzeczywistego egzaminu i jego doświadczeniu z przygotowaniami.

Może obejmować:

- Wynik egzaminu.
- Przebieg egzaminu.
- Subiektywną trudność.
- Ocenę przygotowania.
- Ocenę przydatności platformy.
- NPS.
- Dodatkowe odpowiedzi ankietowe.
- Komentarz.
- Zapamiętane pytania.

## 6.8. RecalledExamQuestion

Pytanie zapamiętane i odtworzone przez użytkownika po rzeczywistym egzaminie.

Nie jest automatycznie zatwierdzonym pytaniem edukacyjnym.

---

# 7. Nauka pisemna

Nauka pisemna opiera się na pytaniach z określonymi poprawnymi odpowiedziami.

Podstawowe możliwości:

- Rozwiązywanie pytań.
- Filtrowanie według ścieżki, dokumentu i zagadnienia.
- Wyświetlanie poprawnej odpowiedzi i wyjaśnienia.
- Przechodzenie do podstawy prawnej.
- Oznaczanie pytań jako trudne.
- Ulubione.
- Historia odpowiedzi.
- Powtórki.
- Egzaminy próbne.
- Statystyki skuteczności.

Wyniki nauki są powiązane z konkretnymi rewizjami pytań i kontekstem ścieżki uprawnień.

Zmiana pytania nie modyfikuje historycznych prób użytkownika.

## 7.1. Egzaminy próbne

Egzamin próbny jest generowany według odpowiedniego ExamBlueprint.

Historyczne podejście zachowuje:

- Ścieżkę.
- Sesję lub kontekst przygotowania.
- Zestaw pytań.
- Wersje pytań.
- Odpowiedzi.
- Konfigurację.
- Wynik.

Zmiany opublikowane podczas trwającego egzaminu nie powinny wpływać na jego treść i ocenę.

---

# 8. Nauka ustna

## 8.1. Model podstawowy

Pytanie ustne zawiera treść i opracowaną odpowiedź.

W V2 dodatkowo może zawierać krótkie pytania sprawdzające rozumienie opracowania, określane jako **Oral Knowledge Checks**.

Nie są one automatycznie pytaniami egzaminu pisemnego.

Mają odrębną funkcję dydaktyczną.

## 8.2. Przebieg nauki

1. Użytkownik widzi pytanie ustne.
2. Próbuje odtworzyć odpowiedź z pamięci.
3. Otwiera opracowanie.
4. System może wyświetlić mini-quiz.
5. Użytkownik odpowiada na pytania sprawdzające.
6. Dokonuje samooceny.
7. Aktualizowany jest stan powtórek dla danej ścieżki.

## 8.3. Adaptacyjne knowledge checks

Mini-quiz nie jest wyświetlany obowiązkowo po każdym pytaniu.

Decyzja może zależeć od:

- Historii nauki w danej ścieżce.
- Samooceny.
- Wcześniejszych błędów.
- Czasu od poprzedniej powtórki.
- Poziomu opanowania materiału.

Początkowo adaptacyjność może być oparta na deterministycznych regułach.

Poprawne rozpoznanie odpowiedzi w quizie nie jest równoznaczne z umiejętnością samodzielnego udzielenia pełnej odpowiedzi ustnej.

System wykorzystuje zarówno wyniki mini-quizów, jak i samoocenę.

Opracowania oraz knowledge checks są wersjonowane.

---

# 9. System powtórek i SRS

Celem systemu powtórek jest określanie, kiedy dany użytkownik powinien ponownie pracować z konkretnym materiałem w kontekście określonej ścieżki.

## 9.1. Główne pojęcia

**LearningItem** — jednostka nauki podlegająca powtórkom.

**ReviewEvent** — zapis wykonanej powtórki.

**UserReviewState** — bieżący stan znajomości materiału przez użytkownika w danej ścieżce.

Przykładowe właściwości UserReviewState:

- userId,
- qualificationPathId,
- learningItemId,
- strategy,
- lastReviewedAt,
- dueAt,
- difficulty,
- stability,
- algorithmVersion.

Dokładne pola zależą od wybranego algorytmu.

Nie ma konieczności tworzenia osobnej encji ReviewSchedule.

Harmonogram można wyznaczać na podstawie UserReviewState i terminu `dueAt`.

## 9.2. Oddzielne strategie

**WrittenReviewStrategy** korzysta głównie z obiektywnych wyników odpowiedzi.

**OralReviewStrategy** korzysta z samooceny, knowledge checks i historii wcześniejszych powtórek.

Wspólne pozostają podstawowe mechanizmy przechowywania stanu i historii.

FSRS jest rozważanym algorytmem, ale jego zastosowanie i szczegółowa konfiguracja nie są rozstrzygnięte.

## 9.3. Kontekst ścieżki

Stan SRS jest oddzielny dla każdej ścieżki.

To samo pytanie może mieć różny termin kolejnej powtórki w różnych ścieżkach tego samego użytkownika.

---

# 10. Gamification

Gamifikacja jest częścią pierwszego wydania.

## 10.1. Learning XP

Punkty są przyznawane za wartościową aktywność edukacyjną, w szczególności:

- Regularną naukę.
- Powtórki.
- Realizację celów.
- Egzaminy próbne.
- Osiąganie postępów.

Samo powtarzanie łatwego pytania wielokrotnie nie powinno generować nieograniczonych punktów.

## 10.2. Streak

Streak motywuje do regularności.

Może zapewniać ograniczony mnożnik Learning XP.

Nie wpływa na ocenę merytorycznej wiarygodności użytkownika.

## 10.3. Daily Goals

Indywidualny cel dziennej aktywności powiązany z motywacją i statystykami.

## 10.4. Badges / Achievements

Odznaki za osiągnięcia edukacyjne, regularność, wyniki, postępy i — w przyszłości — wkład społecznościowy.

## 10.5. Rankingi

Początkowo rankingi bazują na aktywności edukacyjnej.

Możliwe zakresy:

- Miesięczny.
- Ogólny.
- Sesja egzaminacyjna.
- Ścieżka lub specjalność.

W przyszłości rankingi mogą uwzględniać również wkład społecznościowy.

## 10.6. Trzy odrębne mechanizmy

**LearningXP** — punkty za naukę.

**ContributionPoints** — punkty za zatwierdzony wkład w rozwój i utrzymanie platformy.

**TrustReputation** — miara wiarygodności kontrybutora lub recenzenta.

W docelowym głównym rankingu łączonym największą wagę ma mieć wkład w platformę, przy zachowaniu motywacji do regularnej nauki.

Punkty są naliczane na serwerze, idempotentnie, według wersjonowanych reguł.

System uwzględnia korekty i zabezpieczenia antyfarmingowe.

## 10.7. Gamifikacja a wiele ścieżek

Postęp edukacyjny pozostaje per ścieżka.

Gamifikacja może posiadać:

- Wyniki i statystyki związane z konkretną ścieżką.
- Globalny wynik konta agregujący rzeczywistą aktywność użytkownika.

Wymaga to reguł zapobiegających podwójnemu naliczaniu punktów za tę samą czynność.

---

# 11. Reference Documents

## 11.1. Charakter domeny

Materiały egzaminacyjne obejmują nie tylko akty prawne, lecz także:

- Normy.
- Kodeksy zawodowe.
- Instrukcje.
- Wytyczne.
- Inne dokumenty.

Proponowanym nadrzędnym pojęciem jest **ReferenceDocument**.

Przykładowe rodzaje dokumentów:

- Legal Act.
- Professional Code.
- Technical Standard.
- Technical Instruction.
- Guideline.
- Other.

## 11.2. Główne pojęcia

**ReferenceDocument** — trwała tożsamość dokumentu.

**DocumentEdition** — konkretne wydanie dokumentu.

**DocumentPublication** — publikacja stanowiąca źródło dokumentu lub jego zmiany.

**PublicationCopy** — zachowana, niezmienna kopia materiału źródłowego wraz z hashem.

**DocumentSectionAddress** — strukturalny adres jednostki dokumentu.

**DocumentSectionContent** — treść jednostki w danym wydaniu.

**SectionRelocation** — jawna informacja o przeniesieniu, podziale lub scaleniu jednostek.

Dokładne nazwy i granice tych pojęć pozostają do ostatecznego ustalenia.

## 11.3. Szczególny przypadek aktów prawnych

Akt prawny ma dodatkowe właściwości:

- Publikację pierwotną.
- Nowelizacje.
- Teksty jednolite.
- Sprostowania.
- Daty wejścia w życie.
- Przepisy przejściowe.
- Historyczne brzmienia przepisów.

Nie wszystkie mechanizmy właściwe dla prawa mają zastosowanie do pozostałych dokumentów.

## 11.4. Prawa do dokumentów

System rozróżnia dokumenty możliwe do swobodnego udostępniania i materiały objęte ograniczeniami prawnoautorskimi.

W szczególności samo umieszczenie normy technicznej w oficjalnym wykazie nie oznacza prawa do publikowania jej pełnej treści.

---

# 12. Struktura i tożsamość fragmentów

Dokument może zawierać:

- Części.
- Działy.
- Rozdziały.
- Artykuły.
- Paragrafy.
- Ustępy.
- Punkty.
- Litery.
- Załączniki.
- Tabele.
- Inne jednostki strukturalne.

Model uwzględnia różne hierarchie dokumentów.

## 12.1. Tożsamość fragmentu

Proponowany model identyfikuje fragment przez dokument i jego adres strukturalny.

Przykład: dokument Prawo budowlane, artykuł 29, ustęp 1, punkt 5.

Treść fragmentu jest wersjonowana niezależnie od jego adresu.

## 12.2. Przeniesienia i zmiany numeracji

Przeniesienie przepisu nie powoduje automatycznie przepięcia wszystkich powiązań pytań.

Obsługiwane mogą być jawne relacje:

- Przeniesienie 1:1.
- Podział 1:N.
- Scalenie N:1.

Niepewne mapowania wymagają weryfikacji.

## 12.3. Wersja brzmienia

Wersja brzmienia fragmentu jest odrębna od publikacji, w której tekst występuje.

Dwie różne publikacje mogą zawierać to samo brzmienie.

Zmiana cytowania lub publikacji nie musi oznaczać zmiany znaczenia przepisu.

Zmiana treści istotnego fragmentu może wymagać ponownej weryfikacji powiązanych pytań.

---

# 13. Wykazy egzaminacyjne

Wykaz jest oficjalnym zestawieniem dokumentów oraz zakresu ich znajomości, wydawanym przez izbę dla określonej sesji egzaminacyjnej.

## 13.1. Pojęcia

**Syllabus** — wykaz dla określonej izby i sesji.

**SyllabusEdition** — niezmienna wersja oficjalnego wykazu.

**SyllabusSourceDocument** — oryginalny dokument źródłowy.

**SyllabusInterpretation** — strukturalny odczyt wykazu przygotowany przez system lub redakcję.

**SyllabusEntry** — pozycja wykazu, wraz z dokumentem, cytowaniem i zakresem.

**ApplicableSyllabus** — potwierdzony wykaz odniesienia dla danej ścieżki.

Nazewnictwo pozostaje robocze.

## 13.2. Oryginał a odczyt

Oficjalny wykaz oraz odczyt wykonany przez InżynierPRO to odrębne obiekty.

Poprawienie błędu parsera nie tworzy nowej oficjalnej wersji wykazu.

Zmiana dokumentu przez izbę może prowadzić do nowej wersji wykazu.

## 13.3. Zakres ścieżki

Pozycja wykazu może zawierać:

- Oznaczenia wymaganej znajomości stosowane przez izbę.
- Przypisanie do konkretnych ścieżek.
- Zawężenie do wybranych fragmentów dokumentu.

## 13.4. Wybrana sesja a wykaz odniesienia

Nowy wykaz może zostać opublikowany, zanim wszystkie materiały InżynierPRO zostaną sprawdzone względem jego wymagań.

W takiej sytuacji wybrana sesja użytkownika i ostatni potwierdzony wykaz odniesienia mogą się różnić.

Niezweryfikowane materiały nie są przedstawiane jako potwierdzone dla nowego wykazu.

---

# 14. Konsolidacja prawa i dokumenty PDF

## 14.1. Cel

InżynierPRO umożliwia przygotowywanie dokumentów prawnych w odpowiednim brzmieniu oraz tworzenie materiałów do pobrania i wydrukowania.

W wykazach mogą występować:

- Akty pierwotne.
- Teksty jednolite.
- Nowelizacje.
- Sprostowania.
- Dokumenty uzupełniające.

Połączenie samych plików PDF nie gwarantuje uzyskania właściwego brzmienia aktu.

## 14.2. Proces konsolidacji

1. Identyfikacja dokumentu.
2. Pobranie i archiwizacja źródeł.
3. Parsowanie struktury.
4. Ustalenie zmian.
5. Zastosowanie zmian do strukturalnego modelu dokumentu.
6. Walidacja wyniku.
7. Zatwierdzenie redakcyjne.
8. Publikacja wydania.
9. Generowanie widoku i PDF.

## 14.3. Strategia początkowa

**Pierwsze wydania są zatwierdzane ręcznie.**

Automatyzacja może pomagać w parsowaniu, porównywaniu i przygotowywaniu propozycji, ale nie stanowi samodzielnego potwierdzenia poprawności.

Pełna konsolidacja wszystkich rodzajów nowelizacji nie jest wymagana w pierwszym wydaniu.

## 14.4. Rozróżnienie typów opracowań

**Urzędowy tekst jednolity** jest oficjalnie ogłoszonym dokumentem.

**Redakcyjny tekst ujednolicony InżynierPRO** jest opracowaniem przygotowanym na podstawie właściwych źródeł.

Status dokumentu jest jednoznacznie oznaczony.

## 14.5. Przypadki szczególne

Model uwzględnia:

- Przepisy przejściowe.
- Różne daty wejścia w życie.
- Zmiany całych jednostek.
- Uchylenia.
- Załączniki.
- Tabele i grafikę.
- Złożone odesłania.
- Źródła dostępne wyłącznie w PDF.

## 14.6. PDF pojedynczego dokumentu

Docelowe funkcje:

- Właściwe brzmienie.
- Oznaczenie stanu prawnego.
- Źródła.
- Wewnętrzny spis treści.
- Zakładki PDF.
- Numeracja.
- Informacje o wydaniu.

## 14.7. Pakiet egzaminacyjny

Zestaw dokumentów dla wybranej ścieżki, przygotowany do pobrania lub wydruku.

Może posiadać wspólny spis treści i uporządkowaną strukturę dokumentów.

---

# 15. Przeglądarka dokumentów i powiązania z pytaniami

Użytkownik może przeglądać dokumenty bezpośrednio w aplikacji.

Przeglądarka zapewnia:

- Strukturalny spis treści.
- Nawigację po działach, rozdziałach i jednostkach.
- Bezpośrednie otwieranie fragmentów.
- Przejście z pytania do podstawy.
- Przejście z fragmentu do powiązanych pytań.

## 15.1. Relacje

Jeden fragment dokumentu może mieć wiele pytań.

Jedno pytanie może dotyczyć wielu fragmentów.

Powiązania obejmują zarówno pytania pisemne, jak i ustne.

Przy fragmencie może być prezentowana liczba pytań, np. trzy pisemne i dwa ustne.

## 15.2. Typy powiązań

Możliwe rozróżnienia:

- Bezpośrednia podstawa poprawnej odpowiedzi.
- Pomocnicze źródło.
- Powiązanie tematyczne.

Znaczenie powiązania wpływa na reguły weryfikacji.

## 15.3. Tworzenie nowych pytań

W przyszłości użytkownik może rozpocząć dodawanie pytania bezpośrednio z poziomu fragmentu dokumentu.

W takim procesie widzi już istniejące pytania związane z tym fragmentem.

## 15.4. Duplikaty

Mechanizm wykrywania duplikatów może korzystać z:

- Powiązań z tymi samymi fragmentami.
- PostgreSQL Full Text Search.
- Podobieństwa trigramowego.
- W przyszłości porównywania semantycznego.

Decyzja o rzeczywistym zduplikowaniu treści może pozostawać po stronie redaktora.

---

# 16. Educational Content

## 16.1. Główne pojęcia

**Question** — stabilna tożsamość pytania.

**QuestionRevision** — konkretna wersja pytania.

**WrittenQuestion** — pytanie pisemne.

**OralQuestion** — pytanie ustne.

**OralAnswerRevision** — wersja opracowanej odpowiedzi.

**OralKnowledgeCheck** — pytanie sprawdzające rozumienie opracowania.

**QuestionReference** — powiązanie z dokumentem lub fragmentem.

**QuestionVerification** — decyzja weryfikacyjna odnosząca się do określonej wersji treści i źródeł.

**QuestionIssueReport** — zgłoszony problem dotyczący pytania.

**ContentRelease** — spójne, opublikowane wydanie materiałów.

## 16.2. Rewizje

Istotne zmiany treści tworzą nową rewizję.

Dotyczy to w szczególności:

- Treści pytania.
- Zestawu odpowiedzi.
- Poprawnej odpowiedzi.
- Wyjaśnienia.
- Opracowania.
- Podstaw wpływających na poprawność.

## 16.3. Weryfikacja

Weryfikacja odnosi się do konkretnej rewizji pytania oraz odpowiednich wersji źródeł.

Status pytania względem wykazu powinien wynikać z danych weryfikacyjnych, a nie wyłącznie z ręcznej flagi typu „aktualne”.

Pytania praktyczne ustne mogą mieć inne wymagania niż pytania oparte bezpośrednio na przepisach.

---

# 17. Content Publishing

## 17.1. ContentRelease

Proponowany model publikacji opiera się na niezmiennych wydaniach treści.

ContentRelease może wskazywać:

- Wykaz odniesienia.
- Zatwierdzone rewizje pytań.
- Wersje opracowań.
- Odpowiednie wydania dokumentów.
- Konfigurację egzaminu.
- Zakres ścieżek.
- Datę i identyfikator publikacji.

ContentRelease może być manifestem referencji do niezmiennych obiektów, bez fizycznego kopiowania całej bazy.

## 17.2. Spójność wydania

Użytkownik nie powinien otrzymywać pytania z jednej rewizji i odpowiedzi z niezgodnej wersji.

Historyczne podejścia do egzaminów próbnych pozostają odtwarzalne.

## 17.3. Niezależne stany

W modelu rozdzielone są:

- Stan zadania redakcyjnego.
- Stan recenzji.
- Stan potwierdzenia poprawności.
- Stan publikacji.
- Stan zgodności z konkretnym wykazem.

## 17.4. Granulacja

Otwartą decyzją pozostaje, czy ContentRelease jest globalny, przypisany do izby, ścieżki lub określonego katalogu materiałów.

---

# 18. Work Management

Work Management jest wspólnym mechanizmem organizacji prac redakcyjnych.

**Istnieje od pierwszego wydania produktu.**

W MVP jest wykorzystywany wewnętrznie.

W przyszłości jego wybrane funkcje mogą zostać udostępnione społeczności.

## 18.1. WorkItem

Reprezentuje problem, potrzebę albo pracę do wykonania.

Przykładowe informacje:

- Typ zadania.
- Źródło.
- Powiązany obiekt.
- Status.
- Priorytet.
- Widoczność.
- Autor.
- Osoba przypisana.
- Daty.

## 18.2. WorkProposal

Konkretna propozycja rozwiązania zadania.

Jeden WorkItem może mieć więcej niż jedną propozycję.

## 18.3. WorkReview

Recenzja propozycji.

Zawiera decyzję, autora decyzji i uzasadnienie.

## 18.4. WorkItemEvent

Historia działań dotyczących zadania.

## 18.5. Typy zadań

- Zgłoszenie błędu pytania.
- Pytanie zapamiętane po egzaminie.
- Propozycja nowego pytania.
- Recenzja opracowania.
- Aktualizacja dokumentu.
- Weryfikacja wykazu.
- Propozycja artykułu.
- Propozycja FAQ.

## 18.6. Granice odpowiedzialności

Work Management odpowiada za organizację pracy, przypisania, priorytety, historię i workflow.

Nie jest właścicielem wszystkich reguł merytorycznych.

Przykładowo zgłoszenie błędu istnieje w domenie pytań, a WorkItem reprezentuje wynikającą z niego pracę.

Zamknięcie zadania nie oznacza automatycznego zatwierdzenia i opublikowania treści.

## 18.7. Wewnętrzna kolejka MVP

Uprawniona osoba może przeglądać w jednym miejscu:

- Zgłoszenia błędów.
- Zapamiętane pytania egzaminacyjne.
- Propozycje.
- Zadania redakcyjne.
- Zadania dotyczące dokumentów.
- Zadania generowane automatycznie.

Możliwe operacje to filtrowanie, przypisywanie, priorytetyzacja, opracowywanie, recenzowanie i zamykanie zadań.

## 18.8. Priorytet interfejsu

Pełny panel admina nie jest wymagany na początku prac.

Początkowa implementacja Work Management może posiadać minimalne narzędzia wewnętrzne.

Pełny interfejs kolejki i zarządzania treściami może zostać rozwinięty później, przed uruchomieniem odpowiednich operacji produkcyjnych.

---

# 19. Feedback po egzaminie, NPS i zapamiętane pytania

Funkcjonalność zbierania informacji po egzaminie jest częścią MVP.

## 19.1. Przed egzaminem

Użytkownik może otrzymać przypomnienie o możliwości późniejszego przekazania zapamiętanych pytań.

## 19.2. Po egzaminie

Platforma może zapytać:

- Jak przebiegł egzamin?
- Czy egzamin był pisemny czy ustny?
- Czy użytkownik zdał egzamin?
- Jak trudny był egzamin?
- Jak dobrze czuł się przygotowany?
- Czy pytania egzaminacyjne były podobne do materiałów InżynierPRO?
- Jak przydatna była platforma?
- Czy użytkownik pamięta jakieś pytania?
- Jak dokładnie pamięta ich treść?
- Czy chce przekazać komentarz?

## 19.3. Net Promoter Score — NPS

W ankiecie może występować klasyczne pytanie NPS:

**„Na ile prawdopodobne jest, że polecisz InżynierPRO znajomemu przygotowującemu się do egzaminu na uprawnienia budowlane?”**

Skala od 0 do 10.

Interpretacja:

- 0–6 — Detractors.
- 7–8 — Passives.
- 9–10 — Promoters.

NPS jest obliczany jako procent promotorów minus procent krytyków.

NPS dotyczy rekomendowania produktu, a nie trudności samego egzaminu.

## 19.4. Dodatkowy product feedback

Możliwe są również niezależne pytania:

- Ocena przydatności aplikacji.
- Ocena jakości pytań.
- Ocena opracowań ustnych.
- Ocena zgodności materiałów z rzeczywistym egzaminem.
- Ocena UX.
- Brakujące funkcje.
- Najbardziej pomocne funkcje.
- Propozycje ulepszeń.

Nie wszystkie pytania muszą być zadawane jednocześnie.

Ankieta może być krótka, etapowa i opcjonalna.

## 19.5. Wyniki egzaminów

Dobrowolnie przekazane wyniki mogą służyć do analizy skuteczności platformy.

Wyniki deklarowane przez użytkowników nie stanowią automatycznie niezależnie zweryfikowanych danych egzaminacyjnych.

## 19.6. Pytania zapamiętane po egzaminie

Użytkownik może przekazać:

- Treść pytania.
- Rodzaj egzaminu.
- Ścieżkę.
- Sesję.
- Własne notatki.
- Poziom pewności co do zapamiętanego brzmienia.

Wspomnienie jest materiałem wejściowym do procesu redakcyjnego.

## 19.7. Przepływ redakcyjny

**RecalledExamQuestion → WorkItem → Opracowanie → Wykrywanie duplikatów → Weryfikacja → Publikacja**

Zbieranie danych nie zakłada naruszania zasad egzaminu ani pozyskiwania niedozwolonych materiałów.

---

# 20. Community

## 20.1. Zakres

Community jest planowanym, późniejszym rozszerzeniem produktu.

Użytkownicy mogą:

- Zgłaszać błędy.
- Proponować nowe pytania.
- Przygotowywać poprawki.
- Opracowywać odpowiedzi.
- Recenzować materiały.
- Uczestniczyć w pracach nad dokumentami.
- Rozwijać artykuły i FAQ.

## 20.2. Integracja z nauką

Community jest dostępne w kontekście Learning Platform i Mobile, bez osobnej aplikacji.

Przykładowe miejsca interakcji:

- Ekran pytania.
- Opracowanie ustne.
- Fragment dokumentu.
- Dashboard.
- Profil.
- Lista zadań.

## 20.3. Domyślne możliwości

Zarejestrowany użytkownik ma docelowo szerokie możliwości zgłaszania problemów i proponowania zmian.

Większego zaufania wymagają recenzowanie, moderacja, zatwierdzanie i publikowanie.

## 20.4. Reputacja

Reputacja odzwierciedla jakość wkładu, a nie wyłącznie liczbę działań.

Może być wykorzystywana przy ocenie możliwości rozszerzania uprawnień.

Nie nadaje automatycznie prawa do zatwierdzania krytycznych treści prawnych.

## 20.5. Upvote/downvote

Głosy mogą pomagać w priorytetyzacji i wykrywaniu problemów.

Nie są samodzielnym dowodem poprawności merytorycznej.

Samo głosowanie ma znacznie mniejszą wartość niż opracowanie lub zweryfikowanie pytania.

## 20.6. Kontrola jakości

Krytyczne zmiany mogą wymagać wewnętrznej akceptacji organizacji lub właściwie uprawnionego eksperta.

Model przewiduje:

- Audyt.
- Moderację.
- Możliwość cofania uprawnień.
- Odwołania.
- Zabezpieczenia przed spamem.
- Zabezpieczenia przed zmową użytkowników.

## 20.7. Dyskusje

Otwarte forum, prywatne wiadomości i swobodne komentarze nie należą do początkowego zakresu Community.

Podstawowym mechanizmem współpracy pozostają ustrukturyzowane propozycje, recenzje i zadania.

---

# 21. RBAC i Access Policies

## 21.1. Admin RBAC

Panel administracyjny posiada własny zestaw ról i uprawnień.

Przykładowe obszary:

- Administracja systemowa.
- Zarządzanie użytkownikami.
- Zarządzanie treściami.
- Recenzowanie.
- Publikowanie.
- Zarządzanie dokumentami.
- Obsługa zgłoszeń.
- Audyt.
- Konfiguracja infrastrukturalna i operacyjna.

Szczegółowa macierz uprawnień pozostaje do opracowania.

## 21.2. Community Access

Oddzielny zestaw możliwości obejmuje:

- Zgłaszanie.
- Tworzenie propozycji.
- Głosowanie.
- Recenzowanie.
- Moderowanie.
- Zatwierdzanie.
- Publikowanie.

Możliwości mogą być ograniczone według:

- Typu treści.
- Specjalności.
- Kompetencji.
- Statusu użytkownika.

Autoryzacja odbywa się po stronie backendu.

Zarządzanie zadaniami i publikowanie materiałów mogą wymagać różnych uprawnień.

---

# 22. Finansowanie i przyszła monetyzacja

## 22.1. Model początkowy

Cała nauka jest bezpłatna.

Brak paywalla, płatnych limitów pytań i płatnych opracowań.

## 22.2. Elastyczność modelu

Architektura pozostawia możliwość późniejszego wprowadzenia:

- Modelu płatnego.
- Freemium.
- Dostępu promocyjnego.
- Dostępu sponsorowanego.
- Modelu mieszanego.

Logika nauki jest oddzielona od polityk dostępu.

Pełny system billingu nie należy do MVP.

## 22.3. Dobrowolne wsparcie

Rozważane jest wsparcie finansowe platformy, w tym rozwiązania w rodzaju Buy Me a Coffee.

Mechanizm udostępniania wsparcia w aplikacjach mobilnych zależy od właściwych zasad sklepów.

## 22.4. Sponsoring

Docelowo sponsorzy mogą wspierać platformę i nagrody rankingowe.

Nie istnieją jeszcze konkretni sponsorzy.

Sponsoring pozostaje niezależny od weryfikacji merytorycznej.

## 22.5. Nagrody

Preferowane są:

- Vouchery.
- Produkty.
- Szkolenia.
- Udział w wydarzeniach.
- Benefity partnerów.

Standardowe wypłaty gotówkowe nie są planowane.

Nagrody rzeczowe również mogą wymagać regulaminów i odpowiednich rozliczeń.

## 22.6. Wsparcie kontrybutorów

Rozważane modele obejmują indywidualne wsparcie autorów, program ekspertów i osobno wynagradzane opracowania.

Punkty rankingowe nie są automatycznie wymienialne na pieniądze.

## 22.7. Prawa do treści społeczności

Docelowy model licencyjny pozostaje otwarty.

Istotna jest możliwość trwałego wykorzystywania, redagowania i rozwijania materiałów, również w ewentualnym przyszłym modelu komercyjnym.

Licencja niewyłączna nie daje automatycznej wyłączności na treść.

Rozwiązania wyłączne wymagają odpowiednich podstaw i formalności.

---

# 23. Architektura techniczna

## 23.1. Styl

**Modular Monolith + Clean Architecture.**

Backend stanowi jeden system biznesowy podzielony na moduły.

Nie są planowane mikroserwisy.

## 23.2. Podstawowy stack

- TypeScript.
- Effect v4.
- PostgreSQL.
- `@effect/sql-pg`.
- Redis.
- Astro.
- TanStack Start.
- React Native.
- Expo.
- pnpm.
- Turborepo.
- Alchemy jako IaC.

Dodatkowe proponowane elementy:

- Vitest.
- Oxlint.
- Oxfmt.
- OpenTelemetry.
- Object storage.
- Durable queue.

## 23.3. SQL

Preferowane jest korzystanie z Effect SQL, bez niepotrzebnego ORM i dodatkowych warstw.

Migracje SQL pozostają częścią repozytorium.

## 23.4. Moduły

Proponowane konteksty domenowe:

- Examination.
- Syllabuses.
- Reference Documents.
- Educational Content.
- Learning.
- Gamification.
- Work Management.
- Content Publishing.
- Identity & Access.
- Community — później.
- Business Operations — później.

Granice logiczne nie muszą odpowiadać osobnym pakietom npm.

---

# 24. Monorepo i organizacja kodu

## 24.1. Aplikacje

Proponowane aplikacje:

- `apps/api`
- `apps/platform`
- `apps/admin`
- `apps/mobile`
- `apps/site`

Obecność `apps/admin` w docelowym monorepo nie oznacza konieczności rozwijania panelu administracyjnego na początku projektu.

## 24.2. Współdzielone pakiety

Proponowane pakiety:

- `packages/api-contracts`
- `packages/api-client`
- `packages/ui`
- `packages/config`

Pakiety są tworzone dla rzeczywiście współdzielonego kodu.

Nie istnieje założenie tworzenia osobnych pakietów:

- `application`
- `infrastructure`
- `integrations`
- `domain`

wyłącznie dlatego, że odpowiadają warstwom architektury.

## 24.3. Backend

Backend zawiera dwa entrypointy:

- HTTP.
- Worker.

Stanowią osobne procesy korzystające z tego samego codebase.

## 24.4. Struktura modułów

Proponowany moduł zawiera:

**Domain**

- Encje.
- Value objects.
- Reguły biznesowe.
- Błędy domenowe.

**Application**

- Use case'y.
- Porty.
- Orkiestrację.

**Infrastructure**

- Repozytoria SQL.
- Adaptery.
- Integracje.

**Transport**

- Endpointy.
- Walidację protokołu.
- Mapowanie odpowiedzi.

**Public API**

- Jawny interfejs modułu używany przez inne moduły.

## 24.5. Zasady zależności

Domain nie zależy od infrastruktury.

Application korzysta z domeny i portów.

Infrastructure implementuje porty.

Transport wywołuje application.

Bootstrap składa zależności przez Effect Layers.

Prywatne implementacje modułów nie są importowane bezpośrednio przez inne moduły.

---

# 25. Alchemy — Infrastructure as Code

**Alchemy jest wybranym rozwiązaniem Infrastructure as Code dla InżynierPRO V2.**

Infrastruktura jest definiowana i zarządzana przy użyciu TypeScript w ramach tego samego monorepo.

Założenia:

- Definicje infrastruktury są wersjonowane razem z kodem.
- Środowiska są od siebie izolowane.
- Zasoby mają jawnego właściciela i konfigurację.
- Deployment aplikacji i infrastruktury jest powiązany z CI/CD.
- Zmiany infrastruktury są możliwe do przeglądania i audytowania.
- Sekrety nie są przechowywane w repozytorium.
- Operacje destrukcyjne podlegają dodatkowej kontroli.
- Stan infrastruktury jest przechowywany w trwałym, odpowiednio zabezpieczonym mechanizmie.
- Istotne zmiany mogą przechodzić etap podglądu planu przed zastosowaniem.

## 25.1. Zakres zarządzanej infrastruktury

Docelowo Alchemy może zarządzać odpowiednimi zasobami infrastrukturalnymi, zależnie od wybranych dostawców i dostępnych integracji:

- Deployment aplikacji webowych.
- Deployment backendu.
- Procesy background worker.
- Storage.
- Cache.
- Bazy danych lub ich infrastruktura zarządzana.
- DNS i domeny.
- Konfiguracja środowisk.
- Powiązania pomiędzy zasobami.

Wybór konkretnych dostawców hostingu nie jest jeszcze ostatecznie rozstrzygnięty.

## 25.2. Organizacja kodu IaC

Definicje infrastruktury stanowią odrębną część monorepo, np. w głównym katalogu `infra`.

Kod infrastrukturalny może współdzielić typowane konfiguracje i kontrakty, gdy istnieje rzeczywista potrzeba.

Nie jest częścią domenowych use case'ów backendu.

## 25.3. Środowiska

Przewidywane są oddzielne konfiguracje dla:

- Local Development.
- Preview / Pull Request, jeśli wykorzystywane.
- Staging, jeśli wykorzystywane.
- Production.

## 25.4. Bezpieczeństwo

Dostęp agentów do wykonania operacji IaC nie oznacza automatycznie uprawnienia do zmian produkcyjnych.

Zmiany produkcyjne, niszczenie zasobów, zarządzanie sekretami i operacje wpływające na trwałe dane podlegają wyraźnym ograniczeniom.

Alchemy jest częścią Software Factory, CI/CD i modelu operacyjnego projektu.

---

# 26. Redis, cache i wydajność

## 26.1. Redis

Redis jest wykorzystywany do:

- Rate limitingu.
- Wybranego stanu auth/session.
- Cache.
- Innych krótkotrwałych mechanizmów, jeśli są uzasadnione.

Krytyczne dane trwałe wymagają odpowiedniego źródła prawdy.

## 26.2. Wspólny cache

Preferowane jest cachowanie danych współdzielonych przez wielu użytkowników.

Przykłady:

- Opublikowane pytania.
- Dokumenty.
- Wykazy.
- Konfiguracje egzaminów.
- Publiczne materiały.

Klucze mogą uwzględniać wersję wydania, ścieżkę i istotne filtry.

## 26.3. Agregaty

Rankingi i statystyki globalne mogą korzystać z Redis oraz projekcji w PostgreSQL.

## 26.4. Dane użytkownika

Historia nauki, SRS i profil są prywatnymi danymi użytkownika.

Historia nauki i SRS są dodatkowo rozdzielone według ścieżek uprawnień.

Nie istnieje założenie cachowania wszystkich prywatnych zapytań per user.

Podstawą wydajności pozostają poprawny model SQL, indeksy, paginacja i pomiary.

## 26.5. Search

PostgreSQL Full Text Search jest początkowym rozwiązaniem wyszukiwania.

Nie ma planu wdrażania Elasticsearch ani osobnej bazy wektorowej od pierwszego wydania.

---

# 27. Background workers i queue

Background worker jest odrębnym procesem backendu.

Przykładowe zadania:

- Generowanie PDF.
- Pobieranie dokumentów.
- Parsowanie struktury.
- Analiza zmian.
- Aktualizacja indeksów.
- Przeliczanie rankingów.
- Wysyłka powiadomień.
- Tworzenie zadań redakcyjnych.

Wymagane jest trwałe przechowywanie zadań.

Zwykła kolejka w pamięci procesu nie jest wystarczająca dla operacji biznesowych, które muszą przetrwać restart.

Proponowany kierunek:

- Durable queue oparta na PostgreSQL.
- Transactional outbox dla operacji wymagających atomowości.
- Idempotentni konsumenci.
- Retry.
- Obsługa trwale nieudanych zadań.
- Monitoring backlogu.

Nie jest planowany osobny broker Kafka lub RabbitMQ.

**BackgroundJob** oznacza techniczne zadanie wykonywane przez system.

**WorkItem** oznacza zadanie produktowe lub redakcyjne.

---

# 28. Software Factory

Nowe repozytorium jest przygotowane do intensywnego rozwoju przez coding agents.

Główne cele:

- Przewidywalna struktura kodu.
- Precyzyjna dokumentacja domenowa.
- Egzekwowalne zasady architektury.
- Szybkie testy.
- Typowanie.
- Automatyczne review.
- Izolacja środowisk.
- Ograniczanie regresji i zbędnych abstrakcji.

## 28.1. Cztery obszary

**Knowledge** — słownik domenowy, ADR, architektura, standardy, dokumentacja.

**Guardrails** — lint, custom rules, typecheck, testy, dependency checks.

**Agent Execution** — workflow implementacji i izolowane środowiska.

**Verification** — CI, code review i kontrola zgodności zmian z wymaganiami.

## 28.2. Matt Pocock Skills

Zakładane jest wykorzystanie workflow opartego na komponowalnych skills.

Istotne procesy:

- **grill-with-docs** — doprecyzowanie wymagań i decyzji.
- **domain-modeling** — spójność języka domenowego.
- **to-spec** — specyfikacja funkcjonalności.
- **to-tickets** — podział na małe, kompletne zadania.
- **implement** — realizacja.
- **tdd** — red-green-refactor.
- **code-review** — niezależne oceny standardów i zgodności ze specyfikacją.
- **improve-codebase-architecture** — ocena granic i odpowiedzialności modułów.
- **retro** — analiza usprawnień środowiska pracy.

## 28.3. Sandcastle

Sandcastle jest rozważanym narzędziem lub wzorcem organizowania pracy agentów w izolowanych środowiskach.

Możliwe zastosowania:

- Sandboxy.
- Oddzielne branche.
- Równoległe zadania.
- Iteracje implementacyjne.
- Automatyczne review.

Architektura repozytorium nie jest zależna od konkretnego orkiestratora agentów.

---

# 29. Deterministyczne guardrails

Mechaniczne reguły architektury i organizacji kodu są egzekwowane narzędziami, a nie tylko dokumentacją.

## 29.1. Tooling

Proponowane elementy:

- Oxlint.
- Oxfmt.
- TypeScript strict.
- Vitest.
- Custom lint plugin.
- Dependency graph checks.
- CI.

## 29.2. Naming conventions

| Element              | Propozycja              |
| -------------------- | ----------------------- |
| Katalogi             | kebab-case              |
| Pliki TypeScript     | kebab-case              |
| Komponenty React     | PascalCase.tsx          |
| Typy i klasy         | PascalCase              |
| Funkcje i zmienne    | camelCase               |
| Tabele i kolumny SQL | snake_case              |
| Zdarzenia            | domain.entity.action.v1 |

Konwencje są proponowane i wymagają ostatecznego zatwierdzenia.

## 29.3. Custom lint rules

Planowane reguły obejmują:

- Nazwy plików.
- Dozwoloną strukturę folderów.
- Importy między modułami.
- Zależności warstw Clean Architecture.
- Zakaz infrastruktury w domain.
- Zakaz niekontrolowanego dostępu do konfiguracji.
- Zakazane zależności.
- Cykle modułów.

Przykładowe nazwy:

- `inzpro/file-naming`
- `inzpro/module-structure`
- `inzpro/no-cross-module-internals`
- `inzpro/clean-architecture-dependencies`
- `inzpro/no-infrastructure-in-domain`
- `inzpro/no-direct-env-access`
- `inzpro/no-forbidden-imports`

## 29.4. Testy reguł

Własny plugin lint posiada testy:

- Pozytywnych przypadków.
- Negatywnych przypadków.
- Wyjątków.
- Regresji.

Wykrywanie zależności i cykli może być dodatkowo realizowane przez osobny check grafu importów.

---

# 30. Dokumentacja architektury

## 30.1. AGENTS.md

Krótki dokument nawigacyjny obejmujący podstawowe informacje o repozytorium, komendy i lokalizacje szczegółowych dokumentów.

## 30.2. GLOSSARY.md

Kanoniczny słownik domenowy.

Zawiera definicje pojęć, ich rozróżnienia i istotne niepożądane synonimy.

Nie jest szczegółową specyfikacją implementacji.

## 30.3. ADR

Architecture Decision Records opisują istotne decyzje techniczne i domenowe, alternatywy oraz konsekwencje.

## 30.4. Coding Standards

Dokumentacja kwestii wymagających osądu, których nie można w pełni wyegzekwować mechanicznie.

## 30.5. Referencyjny moduł

Planowany jest rzeczywisty vertical slice pokazujący:

- Domain.
- Application.
- Port.
- Adapter PostgreSQL.
- Endpoint.
- Autoryzację.
- Testy.

Przykładowym kandydatem jest utworzenie i obsługa WorkItem.

Możliwe jest również przygotowanie jednego minimalnego przykładu funkcji w panelu administracyjnym, bez rozwijania całego Admin Panel na tym etapie.

---

# 31. Testowanie i CI

Docelowa wspólna komenda kontrolna to `pnpm check`.

Zakres kontroli:

- Formatowanie.
- Lint.
- Custom rules.
- Architecture checks.
- Typecheck.
- Unit tests.
- Integration tests.
- Contract tests.
- Build.

Dodatkowe kontrole CI mogą obejmować:

- Testy migracji SQL.
- Skanowanie sekretów.
- Dependency audit.
- Krytyczne E2E.
- Walidację konfiguracji IaC.

## 31.1. Testy domenowe

Sprawdzają reguły biznesowe bez infrastruktury.

## 31.2. Testy application

Sprawdzają zachowanie use case'ów.

## 31.3. Testy integracyjne

Obejmują rzeczywiste adaptery PostgreSQL, Redis i mechanizm zadań.

## 31.4. Testy kontraktowe

Sprawdzają zgodność API z klientami webowymi i mobilnymi.

## 31.5. Testy E2E

Obejmują pełne scenariusze użytkownika.

## 31.6. Testy architektury

Weryfikują granice modułów i dozwolone zależności.

Główne scenariusze referencyjne obejmują:

- Proces od zgłoszenia pytania po egzaminie do jego publikacji.
- Proces od zmiany brzmienia fragmentu dokumentu do ponownej weryfikacji powiązanych pytań.
- Rozdzielenie historii nauki i SRS tego samego użytkownika pomiędzy ścieżkami.
- Zachowanie historii nauki po zmianie aktywnej ścieżki.

---

# 32. Bezpieczeństwo agentów i infrastruktury

Założenia obejmują:

- Izolowane środowiska pracy.
- Ograniczony dostęp do sekretów.
- Brak niekontrolowanych zmian produkcyjnych.
- Branch protection.
- Obowiązkowe CI.
- Kontrolę destrukcyjnych migracji.
- Kontrolę wdrożeń wykonywanych przez Alchemy.
- Testy infrastruktury na środowiskach nieprodukcyjnych.
- Audyt zmian infrastrukturalnych.

AI code review jest uzupełnieniem deterministycznych checks.

Review może rozpatrywać oddzielnie:

- Zgodność kodu ze standardami.
- Zgodność zachowania ze specyfikacją.

---

# 33. Migracja danych V1

V1 może stanowić źródło:

- Pytań pisemnych.
- Pytań ustnych.
- Opracowań.
- Metadanych.
- Powiązań prawnych.
- Informacji o ścieżkach i sesjach.
- Doświadczeń produktowych.

Dane są mapowane do nowego modelu, bez automatycznego kopiowania starego schematu bazy.

## 33.1. AI-assisted migration

AI może wspierać:

- Redakcję treści.
- Poprawę języka.
- Wykrywanie duplikatów.
- Klasyfikację.
- Proponowanie powiązań z dokumentami.
- Wykrywanie niejednoznaczności.

## 33.2. Weryfikacja

Weryfikacja obejmuje odrębnie:

- Pochodzenie treści.
- Prawa do wykorzystania.
- Poprawność merytoryczną.
- Zgodność z właściwymi źródłami.
- Gotowość do publikacji.

Wynik redakcji przez AI nie jest równoznaczny z zatwierdzeniem poprawności.

Przewidywany jest pilotażowy import reprezentatywnej części katalogu przed pełną migracją.

---

# 34. Observability i utrzymanie

System obejmuje logowanie, tracing, metryki, monitoring błędów, monitoring background jobs i monitoring procesów publikacji.

Istotne dane operacyjne:

- Liczba zgłoszeń.
- Liczba oczekujących zadań.
- Czas obsługi.
- Liczba decyzji cofniętych.
- Czas aktualizacji materiałów po zmianach dokumentów.
- Pokrycie ścieżek.
- Nieudane importy.
- Błędy generowania PDF.
- Problemy synchronizacji publikacji i cache.

## 34.1. Product analytics

Dodatkowe dane produktowe:

- Aktywni użytkownicy.
- Regularność nauki.
- Realizacja celów.
- Retencja.
- Wyniki egzaminów próbnych.
- Postępy per ścieżka.
- Wyniki deklarowane po rzeczywistym egzaminie.
- NPS.
- Ocena przydatności materiałów.
- Ocena pokrycia rzeczywistych pytań egzaminacyjnych.
- Liczba pytań przekazanych po egzaminach.
- Konwersja użytkowników kończących naukę w kontrybutorów.

Wyniki egzaminów deklarowane przez użytkowników i opinie ankietowe są danymi samoopisowymi, a nie niezależnie zweryfikowanymi rezultatami.

## 34.2. Procesy operacyjne

Ważne procesy:

- Wycofanie błędnych materiałów.
- Wstrzymanie automatyzacji.
- Eskalacja sporów redakcyjnych.
- Delegowanie odpowiedzialności.
- Odtwarzanie danych.
- Testowanie kopii zapasowych.
- Zarządzanie incydentami.

---

# 35. Główne ryzyka

| Ryzyko                             | Konsekwencja                             |
| ---------------------------------- | ---------------------------------------- |
| Nadmiar abstrakcji                 | Trudniejszy rozwój i utrzymanie          |
| Nieprecyzyjne granice modułów      | Silne sprzężenie                         |
| Błędna tożsamość fragmentów        | Nieprawidłowe podstawy pytań             |
| Błędy konsolidacji prawa           | Niepoprawne materiały                    |
| Niezweryfikowany import            | Powielanie błędów                        |
| Niespójne wydania                  | Nieodtwarzalne wyniki                    |
| Brak izolacji historii per ścieżka | Mieszanie postępów i harmonogramów nauki |
| Farming punktów                    | Zniekształcone rankingi                  |
| Nadużycia Community                | Spadek jakości bazy                      |
| Przeciążenie redakcji              | Opóźnienia aktualizacji                  |
| Nieprawidłowe uprawnienia agentów  | Ryzyko operacji destrukcyjnych           |
| Brak finansowania                  | Ryzyko utrzymania                        |
| Zależność od jednej osoby          | Ryzyko ciągłości działania               |

---

# 36. Zakres świadomie odłożony

Początkowy zakres nie obejmuje:

- Offline.
- Pełnej synchronizacji lokalnej.
- Mikroserwisów.
- Pełnego event sourcingu.
- Osobnego brokera wiadomości.
- Elasticsearch.
- Dedykowanej bazy wektorowej.
- AI oceniającego wypowiedzi głosowe.
- Automatycznego egzaminatora ustnego AI.
- Publicznego forum.
- Prywatnych wiadomości.
- Pełnego Community.
- Rozbudowanej reputacji społecznościowej.
- Sponsoringu i konkursów.
- Pełnego billingu.
- Pełnej automatycznej konsolidacji prawa bez kontroli redakcyjnej.
- Wielojęzycznych treści edukacyjnych.
- Uniwersalnego frameworka workflow dla wszystkich procesów.
- Rozbudowanego Admin Panel na początku developmentu.

---

# 37. Proponowana kolejność rozwoju

## 37.1. Foundation — Software Factory

- Nowe monorepo.
- Konfiguracja TypeScript, pnpm i Turborepo.
- Alchemy i podstawy IaC.
- Dokumentacja architektury.
- GLOSSARY i ADR.
- Wybrane agent skills.
- Lint i custom rules.
- Testy architektury.
- CI.
- Referencyjny vertical slice.

Na tym etapie pełny Admin Panel nie jest potrzebny.

Może powstać jedna minimalna funkcjonalność administracyjna jako przykład architektury i późniejszych konwencji.

## 37.2. Examination & Knowledge Core

- Izby.
- Ścieżki.
- Sesje.
- Wykazy.
- Dokumenty referencyjne.
- Struktury i fragmenty.
- Wersjonowanie.
- Powiązania z pytaniami.

## 37.3. Learning MVP

- Konto i onboarding.
- Historia nauki per ścieżka.
- Nauka pisemna.
- Nauka ustna.
- Knowledge checks.
- SRS per ścieżka.
- Egzaminy próbne.
- Statystyki.
- Gamifikacja.
- Web i Mobile.

## 37.4. Feedback & Editorial Foundation

- Zgłaszanie błędów.
- Pytania zapamiętane po egzaminie.
- Feedback po egzaminie.
- NPS.
- Wewnętrzny Work Management.
- Minimalny interfejs obsługi zgłoszeń.
- Podstawowe procesy redakcyjne.

## 37.5. Admin & Content Operations

- Rozbudowany panel administracyjny.
- Zarządzanie treściami.
- Pełny interfejs kolejki.
- Recenzowanie.
- Publikowanie.
- Zarządzanie dokumentami.
- Zatwierdzane wydania prawne i PDF.

## 37.6. Community

- Publiczne zadania.
- Propozycje użytkowników.
- Recenzowanie.
- Głosowanie.
- Reputacja.
- Punkty za wkład.
- Moderacja.

## 37.7. Sponsors & Rewards

- Sponsorzy.
- Konkursy.
- Nagrody rzeczowe.
- Wsparcie kontrybutorów.
- Ewentualne dodatkowe modele finansowania.

Etapy opisują zależności i kierunek rozwoju, nie wymagają implementowania wszystkich modułów danego obszaru przed rozpoczęciem kolejnego.

**Priorytet początkowy: Software Factory i działająca aplikacja edukacyjna, nie budowa rozbudowanego zaplecza administracyjnego.**

---

# 38. Potencjalne Architecture Decision Records

Kandydaci do udokumentowania jako ADR:

1. Modular Monolith i Clean Architecture.
2. Hybrydowa organizacja modułów backendowych.
3. Jeden backend z entrypointami HTTP i Worker.
4. Współdzielone pakiety tylko przy rzeczywistym współdzieleniu kodu.
5. Alchemy jako Infrastructure as Code.
6. Deterministyczne guardrails i custom lint rules.
7. ReferenceDocument jako nadrzędny model dokumentów.
8. Strukturalna tożsamość fragmentu.
9. Niezmienne rewizje pytań.
10. Weryfikacja względem konkretnych wersji źródeł.
11. ContentRelease jako spójne wydanie materiałów.
12. Unified Work Management.
13. Rozdzielenie stanu zadania, recenzji i publikacji.
14. Początkowo ręcznie zatwierdzana konsolidacja prawa.
15. UserReviewState i niezmienne ReviewEvents.
16. Izolacja historii nauki i SRS per QualificationPath.
17. Wersjonowane reguły gamifikacji.
18. PostgreSQL jako główne trwałe źródło danych.
19. Redis jako cache i infrastruktura pomocnicza.
20. Durable queue i transactional outbox.
21. Access Policies niezależne od Learning Domain.
22. Odłożenie rozbudowanego Admin Panel na późniejszy etap.

---

# 39. Otwarte decyzje

## 39.1. Domena

- Dokładne granice Examination, Syllabuses i Reference Documents.
- Granice Questions, Oral Content i Content Publishing.
- Granice Work Management i Editorial Review.
- Tożsamość dokumentów niebędących aktami prawnymi.
- Granulacja ContentRelease.
- Szczegółowe zasady potwierdzania zgodności materiałów z wykazami.

## 39.2. Learning

- Algorytm SRS pisemnego.
- Algorytm powtórek ustnych.
- Reguły adaptacyjnych mini-quizów.
- Szczegółowa reprezentacja historii nauki per ścieżka.
- Zachowanie postępu przy zmianie sesji w tej samej ścieżce.
- Ewentualne przenoszenie znajomości pytań między ścieżkami.
- Formuła XP i streak.
- Reguły rankingów.
- Sposób mierzenia postępów i skuteczności nauki.

## 39.3. Architektura

- Ostateczna struktura backendu.
- Szczegółowe kontrakty modułów.
- Auth i sesje.
- Mechanizm durable queue.
- Narzędzia migracji PostgreSQL.
- Hosting.
- Object storage.
- Szczegółowy deployment.
- Konfiguracja Alchemy, providerów i state storage.
- Polityka środowisk preview i staging.

## 39.4. Software Factory

- Dokładny zestaw skills.
- Naming conventions i wyjątki.
- Implementacja custom lint rules.
- Testy zależności.
- Konfiguracja agent sandboxes.
- Polityka AI code review.
- Organizacja issues i specs.

## 39.5. Treści i prawo

- Szczegółowe workflow weryfikacyjne.
- Ostateczny model struktury dokumentów.
- Proces zatwierdzania konsolidacji.
- Obsługa skomplikowanych załączników.
- Metoda oceny jakości importu V1.
- Prawa do istniejących opracowań.

## 39.6. Feedback i analityka

- Ostateczny zakres ankiet po egzaminie.
- Moment prezentowania ankiety.
- Sposób zbierania NPS.
- Częstotliwość ponawiania pytań ankietowych.
- Przechowywanie i analiza feedbacku.
- Segmentowanie wyników według ścieżek i sesji.
- Zasady wykorzystywania dobrowolnie przekazanych wyników egzaminacyjnych.

## 39.7. Community i biznes

- Szczegółowy model reputacji.
- Uprawnienia moderatorów.
- Procedury odwołań.
- Licencje do wkładu społecznościowego.
- Formuły punktacji społecznościowej.
- Zasady konkursów.
- Wsparcie finansowe kontrybutorów.
- Ewentualny przyszły model płatnego dostępu.

---

# 40. Podsumowanie

InżynierPRO V2 to nowa platforma edukacyjna przeznaczona do przygotowania do egzaminów na uprawnienia budowlane PIIB i IARP.

Podstawą produktu są nauka pisemna i ustna, adaptacyjne knowledge checks, powtórki, egzaminy próbne, statystyki, gamifikacja oraz powiązanie pytań z uporządkowanymi i wersjonowanymi źródłami wiedzy.

**Historia nauki, postępy i SRS są rozdzielone według ścieżek uprawnień.** Zmiana aktywnej ścieżki nie usuwa dotychczasowej historii.

System obsługuje dokumenty referencyjne różnego rodzaju, oficjalne wykazy egzaminacyjne, strukturalne fragmenty dokumentów, zatwierdzane wydania treści i generowanie materiałów PDF.

Od pierwszej wersji istnieje wewnętrzny Work Management obsługujący zgłoszenia, zadania redakcyjne oraz pytania zapamiętane po egzaminie.

Po egzaminie użytkownik może przekazać wynik, zapamiętane pytania, NPS oraz dodatkowy feedback produktowy.

Community jest późniejszym rozszerzeniem wykorzystującym istniejące fundamenty produktu, uzupełnione o publiczne zadania, recenzje, moderację i reputację.

Produkt początkowo jest darmowy, lecz nie jest architektonicznie zależny od jednego modelu monetyzacji.

Backend opiera się na Effect v4, PostgreSQL, Redis, modularnym monolicie i Clean Architecture.

Monorepo obejmuje Astro, TanStack Start, React Native i Expo.

**Infrastruktura jest definiowana i zarządzana przez Alchemy jako TypeScript-native IaC.**

Organizacja repozytorium uwzględnia intensywną pracę agentów AI, komponowalne skills, deterministyczne guardrails, custom lint rules, testy, CI i automatyczne code review.

Rozbudowany Admin Panel nie jest początkowym priorytetem. Wczesne prace koncentrują się na Software Factory, architekturze backendu i działającym produkcie edukacyjnym.

Najważniejsze właściwości całego systemu to:

- Poprawność wiedzy.
- Spójność wydań.
- Odtwarzalność historii.
- Historia nauki per ścieżka.
- Audytowalność.
- Klarowne granice modułów.
- Automatyzacja.
- Elastyczność modelu biznesowego.
- Możliwość przyszłego rozwoju społecznościowego.
- Egzekwowalna jakość kodu.
- Długoterminowa rozwijalność bez niepotrzebnej złożoności.
