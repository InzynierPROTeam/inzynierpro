# Konfigurowane ścieżki, cele i dostęp

Wspólna QualificationPath ma unikalną kombinację specjalności, rodzaju uprawnień i zakresu. Osobne przypisanie użytkownik–ścieżka przechowuje zakres dostępu written/oral/both oraz stan archiwizacji. Użytkownik może mieć kilka przypisań i jeden aktywny wybór; zakres można rozszerzać wyłącznie written/oral → both. Zmiana wyboru ani upływ terminu egzaminu nie usuwają historii i nie odbierają uprawnień.

Onboarding pobiera zależne opcje z katalogu i wymaga docelowej sesji właściwej dla izby nadrzędnej specjalności. Izba okręgowa nie jest obowiązkowa. Sesja ma jawny okres dostępności obejmujący również przygotowania ustne po pisemnym. Osobisty termin ustnego jest opcjonalny; bez niego plan korzysta z oznaczonego orientacyjnego terminu sesji. Końcowa komenda atomowo tworzy przypisanie, pierwszy cel i wybór, ponownie walidując konfigurację. Ponowienie nie tworzy duplikatu i nie nadpisuje istniejącego celu.

UserExamGoal jest wersjonowany. Zmiana sesji lub daty dopisuje nową wersję, bez przepinania wcześniejszej aktywności. Web odtwarza szkic onboardingu z URL i czyści zależne wybory po zmianie wcześniejszego kroku. Wcześniejsze kroki nie przyznają dostępu.

Ścieżki są sekcją konta/profilu, z dodawaniem, wyborem, edycją celu, rozszerzeniem dostępu, archiwizacją i przywracaniem. Archiwizacja wybranej ścieżki przełącza na ostatnio używaną aktywną albo czyści wybór. Wejście do niedozwolonego rodzaju nauki pokazuje jawne rozszerzenie do both, obecnie bezpłatne, po którym wracamy do pierwotnej lokalnej strony. Samo wejście niczego nie rozszerza.

To rozszerza wcześniejszy uproszczony zakres Foundation: obowiązkowy cel sesji i powyższe przepływy należą do zadania #6. Pełne cele dzienne, XP, rankingi i wykonanie resetu są odrębnymi zadaniami.

## Typy, daty i paginacja

Identyfikatory powstają ze wspólnego Uuid i zachowują konkretny brand także w opcjach katalogu. Wersja celu i expectedVersion używają UserExamGoalVersion; liczby pytań używają QuestionCount.

Wszystkie daty systemu używają jednego kodeka i typu ApiDateTime: HTTP przyjmuje i zwraca kanoniczny UTC ISO 8601 z milisekundami, a dekodowanie natychmiast daje zwalidowany Effect DateTime.Utc. Nie tworzymy odrębnych typów dla roli daty ani reguły wymuszającej północ. Użytkownik może wybrać lokalną datę i godzinę; klient konwertuje ją na UTC i odpowiada za prezentację we własnej strefie. Brak osobistej daty to Option wewnątrz oraz null w JSON.

Onboarding jest publiczny do etapu zapisania konfiguracji. Osobne endpointy zwracają specjalności, zależne rodzaje i zakresy oraz sesje egzaminacyjne. Mają publiczne grupy kontraktu bez Authentication. Indywidualne przypisania i mutacje pozostają chronione; ich dane pokazujemy tylko po zalogowaniu. Przekierowanie do logowania zachowuje pełny szkic w URL.

Każda lista zasobów ma wspólny format data/meta i paginację: cursor dla klientów, offset dla administracji. Wybór bieżącej ścieżki jest osobnym zasobem, a nie dodatkiem do strony przypisań. Odczyty pojedynczego przypisania, dokumentu i dostępności sesji są punktowe.

Początkowe migracje V2 tworzą docelowe tabele bez addytywnych poprawek prototypu. Pierwsza definiuje wspólny trigger updated_at. Tabele modyfikowalne mają created_at i updated_at; dopisywana historia celów ma created_at. Znaczniki czasu aplikacji mają timestamptz(3). Ochrona opublikowanej treści pozwala na wycofanie rewizji i aktualizację metadanych czasu.
