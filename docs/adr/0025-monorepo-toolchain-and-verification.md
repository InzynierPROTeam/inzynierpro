# Narzędzia monorepo i wspólna komenda weryfikacji

Podstawowy zestaw to pnpm, Turborepo, TypeScript strict, Oxlint, Oxfmt i Vitest. Wspólną konfigurację wydzielamy tam, gdzie korzysta z niej kilka aplikacji lub pakietów. Rozwijamy w ten sposób kierunek szkieletu repozytorium i dokumentu V2.

Docelowe pnpm check sprawdza formatowanie, lint, reguły architektury, typy, testy i build, bez automatycznego poprawiania plików. Formatowanie i naprawy mają osobne komendy. CI egzekwuje wymagane kontrole z wykorzystaniem grafu zależności i cache. Obecny skrypt obejmujący jedynie lint i formatowanie wymaga rozszerzenia przy budowie Software Factory.

Już w Foundation egzekwujemy nazwy, importy przez jawne interfejsy modułów, dozwolone zależności warstw i brak cykli. Najpierw wykorzystujemy gotowe możliwości narzędzi; braki uzupełniamy małym własnym pluginem lub checkiem. Kontrole mają testy dozwolonych przypadków, naruszeń i wyjątków oraz należą do pnpm check i CI.

Lokalny PostgreSQL i Redis mają wspólną konfigurację Docker Compose oraz repozytoryjne komendy uruchomienia usług i migracji. Zapewnia to powtarzalne środowisko developmentu i testów integracyjnych. Konfiguracje lokalna, testowa i produkcyjna mają rozdzielone ustawienia. Na start praca agentów korzysta ze współdzielonego środowiska zgodnie z ADR-0028.

Testujemy przede wszystkim zachowanie przez jawne interfejsy modułów. Czyste reguły mają szybkie testy jednostkowe; transakcje, adaptery SQL, auth i kolejka mają testy integracyjne z rzeczywistym PostgreSQL i Redis. Krytyczne przebiegi użytkownika obejmujemy E2E. Zewnętrznych dostawców zastępujemy kontrolowanymi adapterami tam, gdzie wymaga tego powtarzalność.

Lokalny hook uruchamia szybkie kontrole zmienianych plików, a pełny wymagany zestaw kontroli egzekwuje CI przed połączeniem zmian. Pełne pnpm check pozostaje dostępne lokalnie; każdy commit nie musi uruchamiać całego builda i wszystkich testów integracyjnych. CI jest obowiązkową bramką jakości.
