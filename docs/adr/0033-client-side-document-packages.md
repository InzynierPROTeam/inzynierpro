# Składanie pakietów dokumentów na kliencie

Przechowujemy w R2 bazowe PDF-y konkretnych zatwierdzonych wydań dokumentów. Klient webowy pobiera wybrane dokumenty i składa zestaw z wybraną kolejnością oraz dodatkami, bez przechowywania na backendzie wariantów użytkownika. Ogranicza to liczbę przechowywanych plików i odpowiada sprawdzonemu przepływowi V1. Wynik zachowuje oznaczenia wydań i źródeł.

Początkowa personalizacja obejmuje wybór dokumentów i dodatków, a nie zmianę składu samej treści aktu. Zmiana czcionki lub marginesów treści wymagałaby renderowania z treści strukturalnej i pozostaje późniejszym rozszerzeniem. Przygotowanie poprawnego, zatwierdzonego wydania pozostaje odrębne od lokalnego składania pakietu. Przed wyborem sposobu wykonywania obliczeń sprawdzamy duży pakiet na słabszym urządzeniu; rozwiązanie mobilne ustalamy przy pracach nad klientem mobilnym.

Można pobrać pakiet dostępnych dokumentów, gdy część pozycji wykazu nie ma udostępnionego PDF-u. Brakujące dokumenty pokazujemy w UI przed pobraniem. Gotowy plik, w tym jego spis treści, zawiera wyłącznie dołączone dokumenty, bez wpisów ani stron dla brakujących pozycji.

Błąd pobrania zaznaczonego pliku nie powoduje jego cichego pominięcia. Zachowujemy wybór i pozwalamy ponowić operację albo świadomie usunąć problematyczny dokument z zestawu.
