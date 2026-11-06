# Usunięcie konta i granica zachowywania danych

Użytkownik może samodzielnie usunąć konto z ustawień po ponownym potwierdzeniu tożsamości. Operacja wyłącza przypomnienia i unieważnia sesje. Usuwamy konto, prywatne notatki i indywidualną historię nauki. Zachowujemy rzeczywiście anonimowe statystyki pytań, przydatne do oceny trudności i jakości konkretnych rewizji, z rozróżnieniem m.in. prób samodzielnych i z pomocą. Samo zastąpienie identyfikatora użytkownika innym identyfikatorem nie stanowi wystarczającej anonimizacji.

Zatwierdzony wkład w materiały pozostaje po sprawdzeniu treści pod kątem danych osobowych, z autorstwem wyświetlanym jako „usunięty użytkownik”. Zachowywanie indywidualnych sekwencji odpowiedzi do badań SRS wymagałoby odrębnego uzasadnienia i zasad przechowywania; nie wynika z decyzji o anonimowych statystykach.

Niezmienność zdarzeń nauki oznacza ochronę przed nadpisywaniem wyników w zwykłym działaniu systemu, a nie zakaz usunięcia danych konta. Doprecyzowuje to ADR-0009.

Nie budujemy samoobsługowego eksportu danych. Pozostawiamy możliwość obsługi indywidualnego wniosku, bez pełnego eksportera w ustawieniach ani osobnego procesu generowania paczek na start.

Po potwierdzeniu usunięcia od razu blokujemy konto, sesje i przypomnienia, a czyszczenie danych wykonujemy jako trwałe zadanie w tle. Można je bezpiecznie ponawiać po awarii. Interfejs odróżnia przyjęcie żądania od zakończenia usuwania.
