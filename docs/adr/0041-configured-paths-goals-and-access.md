# Konfigurowane ścieżki, cele i dostęp

Wspólna QualificationPath ma unikalną kombinację specjalności, rodzaju uprawnień i zakresu. Osobne przypisanie użytkownik–ścieżka przechowuje zakres dostępu written/oral/both oraz stan archiwizacji. Użytkownik może mieć kilka przypisań i jeden aktywny wybór; zakres można rozszerzać wyłącznie written/oral → both. Zmiana wyboru ani upływ terminu egzaminu nie usuwają historii i nie odbierają uprawnień.

Onboarding pobiera zależne opcje z katalogu i wymaga docelowej sesji właściwej dla izby nadrzędnej specjalności. Izba okręgowa nie jest obowiązkowa. Sesja ma jawny okres dostępności obejmujący również przygotowania ustne po pisemnym. Osobisty termin ustnego jest opcjonalny; bez niego plan korzysta z oznaczonego orientacyjnego terminu sesji. Końcowa komenda atomowo tworzy przypisanie, pierwszy cel i wybór, ponownie walidując konfigurację. Ponowienie nie tworzy duplikatu i nie nadpisuje istniejącego celu.

UserExamGoal jest wersjonowany. Zmiana sesji lub daty dopisuje nową wersję, bez przepinania wcześniejszej aktywności. Web odtwarza szkic onboardingu z URL i czyści zależne wybory po zmianie wcześniejszego kroku. Wcześniejsze kroki nie przyznają dostępu.

Ścieżki są sekcją konta/profilu, z dodawaniem, wyborem, edycją celu, rozszerzeniem dostępu, archiwizacją i przywracaniem. Archiwizacja wybranej ścieżki przełącza na ostatnio używaną aktywną albo czyści wybór. Wejście do niedozwolonego rodzaju nauki pokazuje jawne rozszerzenie do both, obecnie bezpłatne, po którym wracamy do pierwotnej lokalnej strony. Samo wejście niczego nie rozszerza.

To rozszerza wcześniejszy uproszczony zakres Foundation: obowiązkowy cel sesji i powyższe przepływy należą do zadania #6. Pełne cele dzienne, XP, rankingi i wykonanie resetu są odrębnymi zadaniami.

## Publiczny onboarding

Onboarding jest publiczny do etapu zapisania konfiguracji. Osobne endpointy zwracają specjalności, zależne rodzaje i zakresy oraz sesje egzaminacyjne. Mają publiczne grupy kontraktu bez Authentication. Indywidualne przypisania i mutacje pozostają chronione; ich dane pokazujemy tylko po zalogowaniu. Przekierowanie do logowania zachowuje pełny szkic w URL.

## Powiązane decyzje

[ADR-0021](0021-module-interfaces-data-ownership-and-client-responsibilities.md) definiuje odpowiedzialność modułów i polityk autoryzacji. [ADR-0024](0024-shared-http-contracts-and-client.md) definiuje wspólny format dat, typowane kontrakty, paginację i cache klientów. Wersja celu i expectedVersion korzystają z UserExamGoalVersion.

Początkowe migracje tego przekroju V2 tworzą docelowe tabele bez addytywnych poprawek prototypu. Wspólne zasady znaczników czasu i triggera opisuje [ADR-0025](0025-monorepo-toolchain-and-verification.md). Ochronę opublikowanej treści i możliwość jej wycofania opisuje [ADR-0010](0010-published-revisions-and-emergency-withdrawal.md).
