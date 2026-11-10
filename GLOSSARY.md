# InżynierPRO

Pojęcia domenowe platformy przygotowującej do egzaminów na uprawnienia budowlane.

## Language

**QualificationPath — qualification path**:
A shared qualification variant defined by specialization, qualification kind and scope. It is an independent context of learning history, separate from a user's target exam session or exam access scope.

**ExamSession — sesja egzaminacyjna**:
Oficjalna tura egzaminacyjna organizowana przez izbę. Jest odrębna od indywidualnego terminu egzaminu użytkownika, sesji nauki i podejścia do egzaminu próbnego.

**QualificationProcess — proces kwalifikacyjny**:
Ciąg formalności i etapów prowadzących do zdobycia uprawnień, obejmujący przygotowanie dokumentów, złożenie wniosku i egzaminy. Jest szerszy od samej sesji egzaminacyjnej i od postępu nauki materiału.

**QualificationProcessSchedule — harmonogram procesu kwalifikacyjnego**:
Etapy i terminy procesu kwalifikacyjnego właściwe dla danego zakresu izby i sesji, z uwzględnieniem części wspólnych. Określa przebieg w kalendarzu, a nie wykonanie formalności przez konkretną osobę.

**UserQualificationChecklist — osobista checklista formalności**:
Lista czynności procesu kwalifikacyjnego, których wykonanie deklaruje użytkownik. Jest odrębna od upływu terminów harmonogramu i postępu nauki.

**Syllabus — wykaz egzaminacyjny**:
Oficjalne zestawienie dokumentów i wymaganego zakresu ich znajomości dla określonej izby i sesji egzaminacyjnej.

**SyllabusEdition — wersja wykazu**:
Konkretna oficjalna wersja wykazu zachowana wraz z oryginalnymi plikami źródłowymi. Jest odrębna od naszego odczytu jej zawartości.

**SyllabusInterpretation — odczyt wykazu**:
Ustrukturyzowane odwzorowanie oficjalnej wersji wykazu przygotowane przez system lub redakcję. Poprawienie błędu tego odwzorowania nie zmienia oficjalnej wersji wykazu.

**ApplicableSyllabus — wykaz odniesienia**:
Wykaz, względem którego potwierdzono udostępniany zakres materiałów danej ścieżki. Może różnić się od wykazu docelowej sesji egzaminacyjnej użytkownika, jeżeli aktualizacja materiałów nie została jeszcze potwierdzona.

**ReferenceDocument — dokument referencyjny**:
Dokument stanowiący źródło wiedzy, np. akt prawny, norma, kodeks, instrukcja lub wytyczne. Zachowuje swoją tożsamość między wydaniami.

**DocumentEdition — wydanie dokumentu**:
Konkretne wydanie dokumentu referencyjnego, do którego można odnieść treść materiału i decyzję weryfikacyjną.

**DocumentSectionAddress — adres fragmentu dokumentu**:
Strukturalne oznaczenie jednostki w konkretnym dokumencie, np. artykułu, ustępu, punktu lub tabeli. Wraz z tożsamością dokumentu identyfikuje fragment niezależnie od zmian jego treści.

**DocumentSectionContent — treść fragmentu dokumentu**:
Konkretna wersja treści jednostki dokumentu pod określonym adresem strukturalnym.

**SectionRelocation — przeniesienie fragmentu**:
Jawne powiązanie jednostek dokumentu wskazujące przeniesienie lub zmianę numeracji. Nie powoduje automatycznego przepięcia powiązań pytań.

**QuestionReference — powiązanie pytania ze źródłem**:
Relacja pytania do dokumentu lub jego fragmentu określająca bezpośrednią podstawę odpowiedzi, źródło pomocnicze albo związek tematyczny. Istotność dla poprawności pytania jest określana przez redakcję, niezależnie od wykorzystania relacji do nawigacji.

**WrittenCategory — kategoria nauki pisemnej**:
Dokument referencyjny, pod którym użytkownik znajduje grupę pytań pisemnych. Jest tym samym dokumentem, który stanowi główne miejsce tych pytań w katalogu.

**OralQuestionCategory — kategoria pytań ustnych**:
Grupa pytań ustnych służąca organizacji nauki, np. temat praktyczny lub grupa nazwana od dokumentu. Jest odrębna od dokumentów źródłowych, z których korzystają jej pytania.

**WrittenQuestion — pytanie pisemne**:
Pytanie służące przygotowaniu do egzaminu pisemnego, z trzema wariantami odpowiedzi i dokładnie jednym poprawnym.

**Question — pytanie**:
Trwała tożsamość pytania edukacyjnego, którego treść występuje w kolejnych rewizjach. To samo pytanie może należeć do materiału wielu ścieżek, z zachowaniem oddzielnej historii nauki na każdej z nich.

**OralQuestion — pytanie ustne**:
Pytanie służące przygotowaniu do egzaminu ustnego, posiadające opracowaną odpowiedź. Stanowi całą jednostkę materiału planowaną do powtórek ustnych.

**OralAnswerRevision — rewizja opracowania ustnego**:
Konkretna wersja opracowanej odpowiedzi na pytanie ustne. Jest punktem odniesienia dla zgodności powiązanych pytań sprawdzających.

**OralKnowledgeCheck — pytanie sprawdzające opracowanie ustne**:
Zatwierdzone, wersjonowane pytanie sprawdzające rozumienie określonego opracowania ustnego, wykorzystywane w opcjonalnym mini-quizie po sesji ustnej. Jego wynik wspiera ocenę znajomości całego pytania ustnego; nie jest pytaniem egzaminu pisemnego ani osobną jednostką powtórek.

**OralSessionQuiz — mini-quiz po sesji ustnej**:
Opcjonalny sprawdzian złożony z pytań sprawdzających materiał poznany podczas konkretnej sesji nauki ustnej. Jest odrębny od samej nauki opracowań i samoocen poszczególnych odpowiedzi ustnych.

**OralSelfAssessment — samoocena odpowiedzi ustnej**:
Deklaracja użytkownika dotycząca jego umiejętności samodzielnego udzielenia odpowiedzi na pytanie ustne, obejmująca brak umiejętności, częściową umiejętność lub deklarowaną pełną umiejętność. Jest odrębna od wyniku mini-quizu sprawdzającego rozumienie opracowania.

**QuestionRevision — rewizja pytania**:
Konkretna wersja treści pytania i danych potrzebnych do oceny odpowiedzi, niezmienna po publikacji. Historyczny wynik odnosi się do rewizji wykorzystanej podczas udzielania odpowiedzi.

**QuestionAnswer — question answer option**:
An identifiable answer option belonging to one question revision, with its text and correctness. Its presentation order is chosen for the view or session. It is part of the published question content, distinct from a learner's submitted answer.

**QuestionVerification — weryfikacja pytania**:
Decyzja o poprawności określonej rewizji pytania względem odpowiednich wersji źródeł i zakresu sprawdzenia, wraz z autorem i uzasadnieniem. Jest odrębna od zamknięcia pracy redakcyjnej i publikacji materiału.

**ContentWithdrawal — wycofanie treści**:
Jawna decyzja uprawnionej osoby o zaprzestaniu używania błędnej rewizji materiału do dalszego odpowiadania, również w rozpoczętych sesjach. Zachowuje historyczną treść, odpowiedzi i przyczynę wycofania.

**UserExamGoal — exam preparation goal**:
A user's preparation target on one assigned qualification path, including the target exam session and personal preparation dates. One version is current; later changes preserve earlier goal versions and learning history.

**StudySession — sesja nauki**:
Możliwa do przerwania i wznowienia sesja zwykłej nauki jednego dokumentu lub kategorii, ze stałym zestawem rewizji pytań wybranym na początku. Użytkownik może zatwierdzić odpowiedź na dane pytanie najwyżej raz w tej sesji i od razu otrzymuje ocenę; sesja jest odrębna od powtórek dobieranych przez SRS.
_Avoid_: sesja egzaminacyjna

**ReviewSession — sesja powtórek**:
Odrębna sesja, której pytania dobiera system powtórek na podstawie stanu SRS użytkownika w danej ścieżce. Domyślnie może obejmować materiał z wszystkich dokumentów lub kategorii tej ścieżki.

**LearningRound — runda nauki**:
Kolejne przejście całego materiału danej ścieżki w trybie zwykłej nauki, prowadzone kategoriami. Jest pojęciem wewnętrznym: użytkownik korzysta ze standardowego rozpoczęcia i kontynuacji sesji bez zarządzania rundami.

**SessionPreview — podgląd sesji**:
Propozycja zakresu materiału i dostępnych ustawień, którą użytkownik widzi przed utworzeniem sesji. Pozwala wybrać ustawienia w granicach aktualnie dostępnego materiału i reguł danego trybu.

**StudyAnswerAttempt — próba odpowiedzi w nauce**:
Zatwierdzona odpowiedź użytkownika na pytanie w konkretnej sesji nauki i ścieżce. Kolejna sesja pozwala na nową próbę odpowiedzi na to samo pytanie.

**NewQuestion — nowe pytanie**:
Pytanie, na które użytkownik nie udzielił jeszcze zatwierdzonej odpowiedzi w zwykłym trybie nauki na danej ścieżce. Nowość dotyczy historii tego trybu, a nie daty publikacji pytania ani aktywności w egzaminach, ulubionych i powtórkach.

**FirstPassCompletion — ukończenie pierwszego przejścia**:
Udzielenie przynajmniej jednej zatwierdzonej odpowiedzi w zwykłym trybie nauki na każde pytanie danego zakresu w określonej ścieżce. Oznacza przejście całego zakresu w tym trybie, a nie jego opanowanie.

**UserReviewState — stan powtórek użytkownika**:
Bieżący stan nauki danej jednostki materiału przez użytkownika na określonej ścieżce, wykorzystywany do wyznaczania kolejnych powtórek. Uwzględnia aktywność z różnych trybów i pozostaje odrębny od postępu rundy zwykłej nauki.

**LearningEvent — zdarzenie nauki**:
Niezmienny zapis rzeczywistej aktywności użytkownika wobec określonej rewizji materiału w kontekście ścieżki i rodzaju nauki, wraz z jej wynikiem, czasem i okolicznościami. Stanowi informację do oceny postępów i planowania powtórek; jego znaczenie zależy m.in. od użycia pomocy i trybu ćwiczenia.

**AssistedAnswer — odpowiedź udzielona z pomocą**:
Próba odpowiedzi pisemnej w nauce poprzedzona otwarciem wyjaśnienia lub własnych notatek dotyczących pytania. Ma wynik poprawna/błędna, ale nie jest automatycznie dowodem samodzielnego opanowania materiału.

**MockExamAttempt — podejście do egzaminu próbnego**:
Odrębne podejście użytkownika do egzaminu próbnego, podczas którego nie otrzymuje bieżącej oceny poprawności odpowiedzi. Do zakończenia podejścia może wracać do pytań, zmieniać odpowiedzi oraz jawnie wstrzymywać i wznawiać egzamin.
_Avoid_: sesja egzaminacyjna

**FavoriteQuestion — ulubione pytanie**:
Pytanie oznaczone przez użytkownika jako ulubione, wspólnie dla wszystkich jego ścieżek.

**DifficultQuestion — pytanie oznaczone jako trudne**:
Osobiste oznaczenie pytania przez użytkownika, wspólne dla wszystkich jego ścieżek. Jest odrębne od wyliczonego poziomu opanowania pytania w danej ścieżce.

**PersonalQuestionNote — własna notatka do pytania**:
Prywatna notatka użytkownika przypisana do pytania, wspólna dla jego ścieżek. Pozostaje dostępna po zmianie treści pytania, z informacją o możliwym odniesieniu do wcześniejszego brzmienia.

**WorkItem — zadanie redakcyjne**:
Praca do wykonania w związku ze zgłoszeniem lub potrzebą utrzymania materiałów, z własnym statusem, priorytetem, przypisaniem i historią. Jest odrębna od treści zgłoszenia, decyzji o poprawności i publikacji materiału.

**QuestionIssueReport — zgłoszenie błędu pytania**:
Informacja użytkownika o problemie z konkretną rewizją pytania, z rodzajem problemu, kontekstem nauki i ewentualnym komentarzem. Stanowi materiał wejściowy do obsługi redakcyjnej.

**RecalledExamQuestion — pytanie zapamiętane po egzaminie**:
Treść odtworzona przez użytkownika z pamięci po rzeczywistym egzaminie, wraz z kontekstem ścieżki, izby okręgowej i sesji egzaminacyjnej, o ile są znane, oraz ewentualną niepewnością brzmienia. Jest zgłoszeniem do opracowania, a nie zatwierdzonym pytaniem edukacyjnym ani oficjalnym potwierdzeniem puli pytań izby.

**ExamFeedback — feedback po egzaminie**:
Dobrowolna informacja użytkownika o rzeczywistym egzaminie i ocenie przydatności platformy, odrębna dla części pisemnej i ustnej. Zawiera deklaracje i opinie, a nie niezależnie zweryfikowane wyniki egzaminacyjne.

**LearningXP — punkty za naukę**:
Punkty motywacyjne konta przyznawane za aktywność edukacyjną w różnych rodzajach nauki i ścieżkach. Są odrębne od postępu materiału, stanu SRS i uprawnień redakcyjnych.

**ContributionPoints — punkty za wkład**:
Punkty za zatwierdzony wkład w rozwój i utrzymanie materiałów lub platformy. Są odrębne od punktów za naukę i reputacji.

**TrustReputation — reputacja**:
Miara wiarygodności kontrybutora lub recenzenta oparta na jakości jego wkładu. Jest odrębna od aktywności edukacyjnej i liczby punktów za naukę.

**DailyGoal — dzienny cel nauki**:
Liczba pytań zaplanowanych na dany dzień, osobno dla nauki pisemnej i ustnej w określonej ścieżce. Pomaga zaplanować przejście materiału do wybranego terminu i jest odrębna od wspólnych punktów XP oraz streaka konta.

**Streak — seria dni nauki**:
Liczba kolejnych dni spełniających warunek aktywności edukacyjnej, wspólna dla konta. Jest mechanizmem motywacyjnym, a nie miarą znajomości materiału.

**UserQualificationPath — user path assignment**:
A user's persistent association with a shared qualification path. It has an exam access scope and can be active or archived; it is distinct from both the shared path and the user's exam goal.

**ExamAccessScope — exam access scope**:
The written, oral or combined learning access granted on a user's assigned path. It restricts both interfaces and data access.

**UserExamGoalVersion — exam goal version**:
A historical version of a user's target exam session and personal preparation dates on one assigned path. Later changes do not change the goal associated with earlier activity.
