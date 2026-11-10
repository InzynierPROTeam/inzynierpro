# Konto wymagane do nauki i wspólny przebieg logowania

Nauka wymaga konta. Publiczna witryna i materiały informacyjne pozostają dostępne bez logowania. Pierwsze wydanie nie wymaga anonimowego trybu nauki ani scalania anonimowych postępów z kontem.

Pierwsze wydanie udostępnia zalogowanym użytkownikom całą naukę bez paywalla i płatnych limitów. Pełnego billingu nie budujemy na start. Ewentualna przyszła monetyzacja jest odrębnym obszarem, bez wprowadzania płatności do reguł oceniania i SRS.

Web oferuje Google lub kod e-mail, a mobile dodatkowo Apple. Nie rozdzielamy ekranów rejestracji i logowania: nowe konto powstaje podczas pierwszego uwierzytelnienia. Użytkownik korzysta z tej samej tożsamości w webie i mobile. Wybieramy Better Auth z integracją zamkniętą w module Identity & Access. Na start używamy oficjalnej integracji PostgreSQL z pg/Kysely wyłącznie wewnątrz auth; własne moduły biznesowe pozostają przy natywnym Effect SQL.

Usunięcie pg z auth pozostaje preferencją do ewentualnej późniejszej, osobno zweryfikowanej integracji. Effect v4 nie oferuje gotowego mostu do zwykłego Kysely wymaganego przez Better Auth, a dawny sql-kysely nie był zamiennym sterownikiem Promise dla zewnętrznej biblioteki. Własny most wymagałby obsługi transakcji na tej samej rezerwowanej konekcji, zasobów i zgodności adaptera. Wybieramy obecnie wspieraną integrację, ograniczając własne utrzymanie infrastruktury auth.

Zasady łączenia zachowują zachowanie sprawdzone w zainstalowanym Better Auth 1.7.14 z V1. Istniejące powiązanie dostawcy i jego identyfikatora konta wskazuje właściciela konta. Nowa metoda OAuth może automatycznie dołączyć do użytkownika o tym samym znormalizowanym e-mailu wyłącznie wtedy, gdy zarówno dostawca potwierdza adres, jak i lokalny adres jest już zweryfikowany. Nie konfigurujemy zaufanych dostawców omijających ten wymóg. Różne adresy nie oznaczają automatycznie tej samej osoby. Nie wymagamy osobnego panelu podpinania metod ani scalania istniejących kont na start. W konfiguracji jawnie ustawiamy te reguły, zamiast zakładać niezmienność domyślnych ustawień biblioteki.

Logowanie kodem e-mail korzysta z istniejącego konta o tym adresie lub tworzy zweryfikowane konto. Sprawdzona wersja V1 przy weryfikacji wcześniej niepotwierdzonego konta usuwa jego nieudowodnione powiązania i sesje; integracja V2 musi zachować ochronę przed utrzymaniem takiego dostępu.

PostgreSQL jest trwałym magazynem sesji logowania, a Redis służy pomocniczo do cache i rate limitingu. Redis nie jest jedynym miejscem przechowywania sesji. Integracja wymaga sprawdzenia odczytu, unieważniania i zachowania przy awarii; samo włączenie obu magazynów nie stanowi potwierdzenia tych własności.

## Ustalenia implementacyjne (Foundation, logowanie kodem e-mail)

Konfiguracja Better Auth znajduje się w pakiecie `@inzpro/auth` (serwis Effect budowany z puli PostgreSQL z `@inzpro/db`, `@inzpro/redis` i dostarczanej przez aplikację wysyłki maili), a klient we wspólnym `@inzpro/auth-client`. Moduł `apps/api/src/modules/identity` montuje handler biblioteki pod `/api/v1/auth/*` i udostępnia odczyt sesji. Tabele `users`, `auth_sessions`, `auth_accounts` i `auth_verifications` tworzy wspólna migracja Effect SQL; Better Auth sprawdza zgodność schematu przy starcie, a test pilnuje braku rozbieżności. Prefiks `auth_` odróżnia sesję logowania od sesji nauki. Usunięcie nieudowodnionych powiązań i sesji przy weryfikacji wcześniej niepotwierdzonego konta zapewnia wbudowana logika tej wersji biblioteki.

Sesje i kody logowania są zapisywane w PostgreSQL, a Redis przechowuje ich cache oraz liczniki rate limitingu. Kody przechowujemy jako skróty. Przy niedostępności Redis API odpowiada błędem serwera: nie wysyła kodów bez limitów, nie potwierdza wylogowania i nie zgłasza zalogowanej osoby jako wylogowanej. Po powrocie Redis sesja działa dalej. To zachowanie potwierdzają testy integracyjne.

Stan sesji klienci odczytują przez kontrakt `GET /api/v1/identity/session`, którego brak sesji kończy się błędem `Unauthenticated` (401). Ciasteczko sesji ma prefiks `inzynierpro`, odrębny od V1, aby wspólna domena nie nadpisywała sesji pilotażu. Kody i tokeny sesji nie trafiają do logów. Better Auth połyka błąd wysyłki kodu i odpowiada sukcesem; my zapisujemy porażkę w stanie żądania Better Auth (`defineRequestState`), a hook `after` zamienia odpowiedź na `503 SIGN_IN_CODE_NOT_SENT`. Maile wysyła `EmailService` z `@inzpro/email` (email-sdk, w produkcji Resend), wstrzykiwany do `@inzpro/auth`; testy podają adapter in-memory.

Zakres testów auth obejmuje naszą konfigurację i integrację. Nie utrzymujemy własnej symulacji Google ani ponownych testów mechanizmów OTP i linkingu należących do Better Auth. Pozostają testy URL autoryzacji i dozwolonych callbacków Google, logowania kodem do chronionego API oraz integracji PostgreSQL/Redis, maili, logów i CORS. Rzeczywisty smoke Google wymaga skonfigurowanego klienta i osobnej weryfikacji.

Granica logowania w onboardingu jest określona w [ADR-0041](0041-configured-paths-goals-and-access.md#publiczny-onboarding).

Na webie sesję odczytuje wspólny rodzic _maybeauthenticated. Rozróżnia odmowę uwierzytelnienia od awarii sieci lub serwera; tylko pierwsza oznacza brak użytkownika. Dzieci _authenticated i _notauthenticated sprawdzają otrzymany kontekst i przekierowują bez kolejnego query sesji. Publiczny onboarding należy do tego rodzica, a strona główna pozostaje poza nim i nie wymaga odczytu sesji.
