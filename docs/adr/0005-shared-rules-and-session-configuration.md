# Wspólne reguły klientów i konfiguracja rozpoczętych sesji

Backend jest źródłem reguł tworzenia sesji: podgląd zwraca dostępny zakres materiału, domyślną liczbę pytań, możliwość jej zmiany i dozwolone wartości. Klienci prezentują te dane, a backend ponownie sprawdza wybór przy tworzeniu sesji. Progi takie jak 25/10 definiujemy raz; ich zmiana może dotrzeć do już wydanych klientów po pobraniu nowych danych, o ile zachowujemy zgodność kontraktu API. Samo współdzielenie paczki kodu wymagałoby ponownego wydania klientów, dlatego nie wystarcza do propagowania zmian takich ustawień.

Zmiany konfiguracji dotyczą nowych sesji. Rozpoczęte sesje zachowują ustaloną liczbę pytań, limit czasu i zasady oceny, analogicznie do zachowania rewizji treści. Nie obiecujemy jednoczesnej podmiany ustawień we wszystkich otwartych interfejsach; aktualny backend weryfikuje tworzenie sesji, a mechanizm odświeżania podglądu przy zmianie konfiguracji pozostaje do ustalenia.

Współdzielimy rzeczywiście używane kontrakty API, klienta API, wspólne walidacje i obliczenia, formatowanie oraz elementy identyfikacji wizualnej. Web i admin mogą korzystać ze wspólnych komponentów webowych; mobile korzysta z tych samych reguł i danych oraz komponentów dostosowanych do natywnej obsługi. Pakiety powstają przy rzeczywistym współdzieleniu, bez narzucania wspólnej implementacji całego interfejsu wszystkim platformom.
