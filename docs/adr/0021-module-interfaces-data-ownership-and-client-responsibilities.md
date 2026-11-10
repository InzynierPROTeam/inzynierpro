# Interfejsy modułów, własność danych i odpowiedzialność klientów

Każdy moduł backendu skupia własne reguły domenowe, operacje aplikacyjne, implementacje infrastruktury i transport. Innym modułom udostępnia mały, jawny interfejs. Stosujemy kierunek Clean Architecture, organizowany według odpowiedzialności biznesowych. Warstwy i adaptery powstają tam, gdzie mają rzeczywistą rolę; mały moduł nie wymaga pustych katalogów ani klas jedynie przekazujących wywołania.

Moduł odpowiada za zapis swoich danych. Pozostałe korzystają z jego interfejsu zamiast bezpośrednio zmieniać prywatne tabele. Wspólna baza pozwala zachować transakcje i klucze obce. Przekrojowe odczyty dashboardów i raportów mają jawnie określone modele odczytu, zamiast dowolnego sięgania po prywatne dane innych modułów.

Wszystkie operacje biznesowe przechodzą przez wspólny backend. Kod serwerowy webu i admina może obsługiwać renderowanie i pobieranie danych; tworzenie sesji, ocenianie, SRS, XP, publikacja i autoryzacja należą do backendu. Klienci mogą współdzielić walidację i obliczenia pomocnicze, ale ostateczne reguły egzekwuje backend.

## CQRS i autoryzacja

CQRS rozdziela operacje query i command w jednym PostgreSQL. Query korzysta z jawnego readera/modelu odczytowego, command z repozytorium i transakcji. Stosujemy suffixy .query.ts, .command.ts, .policy.ts, .reader.ts, .repository.ts, .reader.postgres.ts, .repository.postgres.ts oraz .rules.ts dla czystych reguł. Każdy moduł z transportem ma jeden http.ts. Query opisuje autoryzację lub składanie wyniku; prosty odczyt może wywołać reader bezpośrednio z handlera. Command reprezentuje jedną intencję, repository zapisuje dane, a reader udostępnia punktowe odczyty i strony list. Komendy mogą używać readerów do sprawdzania stanu. Nie wymagamy osobnych klas lub plików bez rzeczywistej odpowiedzialności.

HTTP uwierzytelnia i dostarcza zaufaną tożsamość. Polityka aplikacyjna sprawdza aktywne przypisanie ścieżki i wymagany zakres written/oral przed odczytem wyniku. Kontrola korzysta obecnie bezpośrednio z PostgreSQL i musi uwzględniać zakończoną archiwizację lub rozszerzenie od następnego żądania. Kolejne wejścia w imieniu użytkownika korzystają z tej samej polityki.

## Moduły przygotowania do egzaminu

Zastępujemy zbiorcze `examination` pięcioma odpowiedzialnościami:

- `qualification-paths`: specjalności, rodzaje, zakresy i wspólne warianty ścieżek.
- `exam-calendar`: izby nadrzędne, sesje egzaminacyjne i dostępność wyboru sesji.
- `preparation`: onboarding, przypisania użytkownika, wybór, uprawnienia, archiwizacja i wersjonowane cele.
- `learning-content`: wspólne dokumenty, pytania, rewizje i powiązania materiałów ze ścieżkami.
- `study`: osobiste pokrycie materiału i modele odczytowe nauki, w tym dokumenty z postępem i podgląd sesji.

`qualification-paths` i `exam-calendar` udostępniają publiczne endpointy katalogowe; `preparation` i `study` wymagają uwierzytelnienia. `learning-content` udostępnia wewnętrzny interfejs zapisu treści. Zmiana konfiguracji korzysta z jednej transakcji PostgreSQL, blokady konta i ponownej walidacji katalogu/kalendarza. Odczyt dokumentów z postępem pozostaje jednym żądaniem HTTP zależnym od użytkownika.

Handler mapuje konkretne błędy modułów przez inline Effect.catchTags. Adapter SQL pobiera płaskie kolumny i składa obiekty w TypeScript; wejście do SQL przygotowuje przed interpolacją.
