# Interfejsy modułów, własność danych i odpowiedzialność klientów

Każdy moduł backendu skupia własne reguły domenowe, operacje aplikacyjne, implementacje infrastruktury i transport. Innym modułom udostępnia mały, jawny interfejs. Stosujemy kierunek Clean Architecture, organizowany według odpowiedzialności biznesowych. Warstwy i adaptery powstają tam, gdzie mają rzeczywistą rolę; mały moduł nie wymaga pustych katalogów ani klas jedynie przekazujących wywołania.

Moduł odpowiada za zapis swoich danych. Pozostałe korzystają z jego interfejsu zamiast bezpośrednio zmieniać prywatne tabele. Wspólna baza pozwala zachować transakcje i klucze obce. Przekrojowe odczyty dashboardów i raportów mają jawnie określone modele odczytu, zamiast dowolnego sięgania po prywatne dane innych modułów.

Wszystkie operacje biznesowe przechodzą przez wspólny backend. Kod serwerowy webu i admina może obsługiwać renderowanie i pobieranie danych; tworzenie sesji, ocenianie, SRS, XP, publikacja i autoryzacja należą do backendu. Klienci mogą współdzielić walidację i obliczenia pomocnicze, ale ostateczne reguły egzekwuje backend.
