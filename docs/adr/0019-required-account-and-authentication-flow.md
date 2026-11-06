# Konto wymagane do nauki i wspólny przebieg logowania

Nauka wymaga konta. Publiczna witryna i materiały informacyjne pozostają dostępne bez logowania. Pierwsze wydanie nie wymaga anonimowego trybu nauki ani scalania anonimowych postępów z kontem.

Pierwsze wydanie udostępnia zalogowanym użytkownikom całą naukę bez paywalla i płatnych limitów. Pełnego billingu nie budujemy na start. Ewentualna przyszła monetyzacja jest odrębnym obszarem, bez wprowadzania płatności do reguł oceniania i SRS.

Web oferuje Google lub kod e-mail, a mobile dodatkowo Apple. Nie rozdzielamy ekranów rejestracji i logowania: nowe konto powstaje podczas pierwszego uwierzytelnienia. Użytkownik korzysta z tej samej tożsamości w webie i mobile. Wybieramy Better Auth z integracją zamkniętą w module Identity & Access. Na start używamy oficjalnej integracji PostgreSQL z pg/Kysely wyłącznie wewnątrz auth; własne moduły biznesowe pozostają przy natywnym Effect SQL.

Usunięcie pg z auth pozostaje preferencją do ewentualnej późniejszej, osobno zweryfikowanej integracji. Effect v4 nie oferuje gotowego mostu do zwykłego Kysely wymaganego przez Better Auth, a dawny sql-kysely nie był zamiennym sterownikiem Promise dla zewnętrznej biblioteki. Własny most wymagałby obsługi transakcji na tej samej rezerwowanej konekcji, zasobów i zgodności adaptera. Wybieramy obecnie wspieraną integrację, ograniczając własne utrzymanie infrastruktury auth.

Zasady łączenia zachowują zachowanie sprawdzone w zainstalowanym Better Auth 1.7.14 z V1. Istniejące powiązanie dostawcy i jego identyfikatora konta wskazuje właściciela konta. Nowa metoda OAuth może automatycznie dołączyć do użytkownika o tym samym znormalizowanym e-mailu wyłącznie wtedy, gdy zarówno dostawca potwierdza adres, jak i lokalny adres jest już zweryfikowany. Nie konfigurujemy zaufanych dostawców omijających ten wymóg. Różne adresy nie oznaczają automatycznie tej samej osoby. Nie wymagamy osobnego panelu podpinania metod ani scalania istniejących kont na start. Wybraną wersję biblioteki trzeba skonfigurować i przetestować dla tych jawnych reguł, zamiast zakładać niezmienność jej domyślnych ustawień.

Logowanie kodem e-mail korzysta z istniejącego konta o tym adresie lub tworzy zweryfikowane konto. Sprawdzona wersja V1 przy weryfikacji wcześniej niepotwierdzonego konta usuwa jego nieudowodnione powiązania i sesje; integracja V2 musi zachować ochronę przed utrzymaniem takiego dostępu.

PostgreSQL jest trwałym magazynem sesji logowania, a Redis służy pomocniczo do cache i rate limitingu. Redis nie jest jedynym miejscem przechowywania sesji. Integracja wymaga sprawdzenia odczytu, unieważniania i zachowania przy awarii; samo włączenie obu magazynów nie stanowi potwierdzenia tych własności.
