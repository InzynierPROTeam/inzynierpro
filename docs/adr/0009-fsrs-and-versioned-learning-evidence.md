# FSRS i wersjonowana interpretacja historii nauki

FSRS jest podstawą harmonogramu powtórek pisemnych i ustnych. Korzystamy z gotowej implementacji zamiast tworzyć własny algorytm pamięci. Osobne strategie tłumaczą wyniki pisemnego i ustnego na informacje dla algorytmu; reguły uwzględniają tryb, pomoc, samoocenę, mini-quizy i zakończone egzaminy. Stany i tabele pisemnego oraz ustnego pozostają odrębne zgodnie z ADR-0008. Użytkownik nie konfiguruje algorytmu.

Zachowujemy niezmienną historię zdarzeń nauki z rzeczywistym wynikiem, kontekstem, czasem i rewizją materiału oraz wersje reguł użytych do przeliczenia stanu SRS. Pozwala to wyjaśnić harmonogram i przeliczyć jego bieżący stan po zmianie reguł lub algorytmu bez utraty pierwotnych danych. Przeliczenie harmonogramu nie zmienia historycznych odpowiedzi ani wyników egzaminów.

Początkowo samodzielna poprawna odpowiedź pisemna daje Good, a błędna Again. Nie oceniamy łatwości na podstawie szybkości kliknięcia i nie wymagamy dodatkowej samooceny po pisemnym. Rozważone sposoby przyznawania Easy nie należą do początkowej strategii; przyjmujemy mapowanie Again/Good.

W ustnym brak umiejętności i częściowa umiejętność oznaczają, że użytkownik nie potrafi jeszcze samodzielnie udzielić wystarczającej odpowiedzi; oba wyniki mapujemy początkowo na Again. Deklarowaną pełną umiejętność mapujemy na Good. Trzy różne samooceny zachowujemy w historii. Nie utożsamiamy niepełnej odpowiedzi z Hard, które oznacza udane przypomnienie z trudnością.

Poprawną odpowiedź pisemną z pomocą zachowujemy jako poprawny wynik, ale bez standardowego wydłużenia terminu za samodzielny sukces. Dla nowego pytania planujemy wczesną samodzielną weryfikację. Dla istniejącego stanu nie odsuwamy powtórki wyłącznie dzięki odpowiedzi po podglądzie; błędna odpowiedź pozostaje informacją o nieudanym rozwiązaniu. Dokładne terminy wymagają konfiguracji strategii.

Quiz wykonany bezpośrednio po sesji jest dodatkową weryfikacją tego samego kontaktu z materiałem. Zachowujemy osobne zdarzenia samooceny i quizu, ale poprawna odpowiedź w quizie nie stanowi automatycznie drugiego niezależnego sukcesu wydłużającego termin. Błąd może skorygować ocenę znajomości i przyspieszyć powtórkę, bez nadpisywania historycznej deklaracji. Quiz wykonany po dłuższej przerwie wymaga uwzględnienia rzeczywistego odstępu czasu. Dokładna granica czasowa i sposób łączenia sygnałów wymagają konfiguracji strategii.

Szczegółowa wersja implementacji i modelu FSRS, parametry oraz interpretacja natychmiastowego ponownego rozwiązywania pozostają do ustalenia. Wersjonowaniu podlegają również reguły interpretacji zdarzeń aplikacji.

Niezmienność zdarzeń dotyczy zwykłego przetwarzania nauki i nie blokuje usunięcia prywatnej historii wraz z kontem. Zachowywanie anonimowych statystyk i zatwierdzonego wkładu określa ADR-0037.
