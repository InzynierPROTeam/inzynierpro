# Kontekst produktu i mapa specyfikacji

Aktualny zakres produktu jest zapisany w GitHub Issues. Ta mapa jest punktem wejścia dla kolejnego agenta; do pracy nie jest potrzebna historia rozmowy projektowej.

## Specyfikacje

- [InżynierPRO V2 — cały system, reguły i etapy](https://github.com/InzynierPROTeam/inzynierpro/issues/1). Specyfikacja nadrzędna; nie jest jednym zadaniem implementacji całego produktu.
- [Foundation — pierwszy działający przekrój](https://github.com/InzynierPROTeam/inzynierpro/issues/2). Natywne sub-issue specyfikacji systemu; określa zakres pierwszego etapu i kryteria ukończenia.

Specyfikacje mają format lokalnego skillu `to-spec`. Zadania implementacyjne powstaną przez `to-tickets` po uzgodnieniu podziału, wielkości przekrojów i rzeczywistych zależności. Opublikowanie specyfikacji nie oznacza rozpoczęcia implementacji ani ukończenia wszystkich funkcji V2.

## Jak odczytać kontekst

1. Przeczytaj specyfikację nadrzędną, zwłaszcza zakres etapu, reguły wspólne i rzeczy odłożone. Jeśli pracujesz nad konkretną funkcją, przeczytaj również jej specyfikację podrzędną i zadanie.
2. Używaj pojęć z [GLOSSARY.md](../GLOSSARY.md). Słownik definiuje terminy, nie szczegóły implementacji.
3. Przeczytaj właściwe [ADR-y](adr/) według mapy poniżej. Zapisują decyzje i kompromisy; odrzucona alternatywa w uzasadnieniu nie jest aktualnym wymaganiem.
4. Sprawdź rzeczywisty stan kodu i otwarte zależności zadania. Opis docelowego systemu nie oznacza, że moduł lub funkcja już istnieje.
5. Zgłoś sprzeczność między zadaniem, specyfikacją i ADR-em, wskazując konkretne źródła. Rozstrzygnięcie utrwal w tych dokumentach, zamiast opierać pracę na domyślnym założeniu albo pamięci czatu.

Repozytorium V2 to `inzynierpro`. Sąsiednie `inzynier-pro` jest V1 i może służyć jako źródło faktów oraz treści do importu; jego zachowanie nie zastępuje jawnych decyzji V2. Weryfikacja V1 podczas wywiadu była tylko do odczytu i nie potwierdzała produkcyjnego pokrycia katalogu. Dostęp do danych produkcyjnych i reset działającej bazy nie wynikają z decyzji o jednorazowym imporcie.

## Mapa pokrycia decyzji

Sekcje D1–D17 oznaczają nazwane obszary `Implementation Decisions` w nadrzędnej specyfikacji. Poniższa mapa pozwala sprawdzić pokrycie wszystkich 40 ADR-ów bez powielania ich treści.

| ADR                                                                                                             | Obszar specyfikacji nadrzędnej  |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| [0001 — pilotaż](adr/0001-independent-v2-pilot.md)                                                              | Solution; D1, D17; Out of Scope |
| [0002 — cykl odpowiedzi i sesje](adr/0002-study-and-exam-answer-lifecycle.md)                                   | D2, D3, D6                      |
| [0003 — odwołania do rewizji](adr/0003-session-references-to-shared-revisions.md)                               | D2, D7                          |
| [0004 — pauza egzaminu](adr/0004-explicit-mock-exam-pause.md)                                                   | D6                              |
| [0005 — konfiguracja sesji](adr/0005-shared-rules-and-session-configuration.md)                                 | D2, D15                         |
| [0006 — SRS i runda](adr/0006-srs-evidence-and-learning-round-progress.md)                                      | D5                              |
| [0007 — ustny i mini-quiz](adr/0007-oral-knowledge-checks-as-supporting-evidence.md)                            | D4, D5                          |
| [0008 — rozdzielenie pisemnego i ustnego](adr/0008-written-and-oral-learning-separation.md)                     | D5                              |
| [0009 — FSRS i zdarzenia](adr/0009-fsrs-and-versioned-learning-evidence.md)                                     | D5, D14                         |
| [0010 — rewizje i wycofanie](adr/0010-published-revisions-and-emergency-withdrawal.md)                          | D7                              |
| [0011 — weryfikacja i wykaz odniesienia](adr/0011-verification-evidence-and-reference-syllabus.md)              | D7, D8                          |
| [0012 — wspólna publikacja](adr/0012-shared-question-catalog-and-single-publication.md)                         | D7                              |
| [0013 — dokumenty](adr/0013-reference-documents.md)                                                             | D8, D9                          |
| [0014 — wykaz i jego odczyt](adr/0014-official-syllabus-and-its-interpretation.md)                              | D8                              |
| [0015 — kategorie i kontekst regionalny](adr/0015-written-document-groups-and-oral-categories.md)               | D2, D10                         |
| [0016 — fragmenty i znaczenie źródeł](adr/0016-structural-fragments-and-reference-meaning.md)                   | D8, D9                          |
| [0017 — zadania i zgłoszenia](adr/0017-internal-work-management-and-submissions.md)                             | D10, D11, D12                   |
| [0018 — gamifikacja](adr/0018-learning-gamification-and-study-day.md)                                           | D13                             |
| [0019 — konto i auth](adr/0019-required-account-and-authentication-flow.md)                                     | D1                              |
| [0020 — monolit, HTTP i worker](adr/0020-modular-monolith-http-and-worker.md)                                   | D15, D16                        |
| [0021 — interfejsy i własność danych](adr/0021-module-interfaces-data-ownership-and-client-responsibilities.md) | D15, D16                        |
| [0022 — Effect SQL i wyszukiwanie](adr/0022-effect-v4-and-postgresql-sql.md)                                    | D9, D15                         |
| [0023 — atomowość i kolejka](adr/0023-atomic-learning-actions-and-durable-jobs.md)                              | D16                             |
| [0024 — kontrakty i kompatybilność](adr/0024-shared-http-contracts-and-client.md)                               | D15                             |
| [0025 — narzędzia i testy](adr/0025-monorepo-toolchain-and-verification.md)                                     | D17; Testing Decisions          |
| [0026 — aplikacje i nazwy](adr/0026-applications-packages-and-naming.md)                                        | D15, D17                        |
| [0027 — klienci i publiczny web](adr/0027-client-frameworks-and-language-scope.md)                              | D1, D15; historie 1, 65, 78     |
| [0028 — współdzielone środowisko](adr/0028-shared-agent-environment-first.md)                                   | D17                             |
| [0029 — hosting i wdrożenia](adr/0029-vps-dokploy-cloudflare-and-deployment-environments.md)                    | D17                             |
| [0030 — Alchemy i R2](adr/0030-alchemy-v2-and-r2-object-storage.md)                                             | D9, D17                         |
| [0031 — import V1](adr/0031-one-time-v1-catalog-import.md)                                                      | D17                             |
| [0032 — rich content](adr/0032-versioned-rich-content-and-renderer-compatibility.md)                            | D9                              |
| [0033 — lokalne składanie PDF](adr/0033-client-side-document-packages.md)                                       | D9                              |
| [0034 — powiadomienia](adr/0034-notifications-and-material-updates.md)                                          | D14                             |
| [0035 — diagnostyka i analityka](adr/0035-diagnostics-from-first-vertical-slice.md)                             | D16                             |
| [0036 — workflow agentów](adr/0036-agent-spec-ticket-and-review-workflow.md)                                    | D17; Further Notes              |
| [0037 — usunięcie konta](adr/0037-account-deletion-and-retention-boundary.md)                                   | D14                             |
| [0038 — redakcyjne MCP](adr/0038-editorial-mcp-interface.md)                                                    | D12                             |
| [0039 — analiza jakości pytań](adr/0039-background-question-quality-analysis.md)                                | D16; Out of Scope               |
| [0040 — izby i proces kwalifikacyjny](adr/0040-chamber-directory-and-qualification-process-guide.md)            | D10                             |

## Ustalenia spoza początkowych ADR-ów

Specyfikacja nadrzędna zachowuje również późniejsze ustalenia i jawne odłożenia:

- Rozważenie niewidocznych oznaczeń własnych opracowań do wyszukiwania kopii: kierunek do oceny, bez wybranej techniki lub gwarancji; sekcja Out of Scope.
- Brak osobnego trybu powrotu po przerwie; konfigurowalna liczba pytań w zwykłym preview powtórki; D2.
- Materiały praktyczne mogą znajdować się w opracowaniach ustnych bez odrębnego trybu; D4.
- Brak osobnych priorytetowych inicjatyw nagrywania wypowiedzi, dostępności i badań użyteczności w przyjętym zakresie; Out of Scope. Zachowane są motywy i kierunek samouczka.
- Community, licencja wkładu, sponsorzy i monetyzacja to kierunki przyszłe z nierozstrzygniętymi szczegółami, a nie zależności pierwszego przekroju; D11, D13 i Out of Scope.

## Utrzymanie

- Zmianę zachowania zapisuj w odpowiedniej specyfikacji GitHub; szczegół nowej funkcji w specyfikacji podrzędnej. Unikaj drugiej ręcznie utrzymywanej kopii pełnej specyfikacji w repo.
- Zmianę istotnej decyzji lub kompromisu utrwal również w ADR i zaktualizuj mapę, jeśli zmienia się jej zakres. Definicję nowego pojęcia dodaj do słownika.
- Przy zamykaniu zadania wskaż spełnione kryteria i weryfikację. Częściowa implementacja nie zmienia samoczynnie przyjętego zakresu systemu.
- Szczegóły oznaczone jako otwarte rozstrzygaj przed implementacją właściwej funkcji. Są one jawnie wymienione w Further Notes specyfikacji nadrzędnej.

[Pierwotny zarys V2](archive/v2-initial-outline.md) pozostaje archiwum. Nie jest równoległą specyfikacją; zawiera propozycje zastąpione późniejszymi ustaleniami, np. ContentRelease per ścieżka i quizy między pytaniami ustnymi.
