# Telemetria OTLP i Grafana Cloud

Backend eksportuje trace'y i logi protokołem OTLP przez wbudowane moduły `effect/observability`, bez pakietów `@opentelemetry/*`. Kod pozostaje niezależny od dostawcy: endpoint, nagłówki i atrybuty zasobu pochodzą ze standardowych zmiennych `OTEL_*`. Na start wysyłamy dane do Grafana Cloud w regionie EU; zmiana dostawcy wymaga tylko zmiany konfiguracji. Bez skonfigurowanego endpointu spany pozostają w pamięci, a logi trafiają wyłącznie na stdout. Na produkcji stdout zachowuje logi JSON jako zapas, gdy eksport nie działa.

Zasób opisuje `service.name` (`inzpro-api`, a dla workera osobna nazwa), wersję jako SHA commita w `OTEL_SERVICE_VERSION` oraz `deployment.environment.name` w `OTEL_RESOURCE_ATTRIBUTES`. Warstwa obserwowalności jest częścią `apps/api`, ponieważ HTTP i worker są punktami wejścia tej samej aplikacji (ADR-0026). Pakiety współdzielone używają tylko `Effect.log` i spanów; o eksporcie decyduje proces.

Każde żądanie HTTP ma span serwera z `http.route` i kodem odpowiedzi. Komendy, zapytania oraz metody readerów i repozytoriów PostgreSQL powstają przez `Effect.fn('Właściciel.operacja')`, co pilnuje reguła Oxlint. SQL dostaje spany z `@effect/sql` z tekstem zapytania bez parametrów. Czyste funkcje domenowe nie mają spanów. Atrybuty spełniają konwencje semantyczne OpenTelemetry, a własne mają przedrostek `app.`. Nagłówek `x-request-id` zwraca identyfikator trace'a, więc zgłoszony błąd prowadzi bezpośrednio do trace'a i powiązanych logów.

Telemetria może zawierać `user.id`. Nie zawiera adresu e-mail, pełnego adresu IP, treści żądań i odpowiedzi, parametrów SQL, ciasteczek, nagłówków autoryzacji ani danych wykluczonych w ADR-0035. Tracer usuwa atrybuty o wrażliwych nazwach przed eksportem, w tym `client.address`. Logi nie przechodzą przez ten filtr, dlatego nie logujemy wrażliwych wartości.

Na start zapisujemy wszystkie trace'y, a dziecko dziedziczy decyzję rodzica z `traceparent`. Health-check i preflight `OPTIONS` nie są śledzone. Po przekroczeniu limitu dostawcy przechodzimy na tail sampling, który zachowuje błędy i wolne żądania. Metryki RED wylicza Grafana ze spanów; własne metryki, w tym stan kolejki, dodamy razem z workerem. Telemetria przeglądarki wymaga osobnej decyzji.

Alerty w Grafanie obejmują odsetek odpowiedzi 5xx, p95 czasu odpowiedzi, niedostępny health-check oraz brak napływających spanów. Powiadomienia trafiają na Telegram. Na początku konfigurujemy je w interfejsie Grafany; zapis jako kod pozostaje do ustalenia razem z IaC (ADR-0030).
