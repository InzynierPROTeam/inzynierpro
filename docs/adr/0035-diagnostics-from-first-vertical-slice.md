# Diagnostyka od pierwszego działającego przekroju

Pierwszy działający przekrój obejmuje identyfikatory żądań, logi, śledzenie błędów i podstawowy monitoring API oraz trwałej kolejki. Pozwala to ustalić przyczynę nieudanego zapisu odpowiedzi lub utknięcia zadania, zanim system obejmie kolejne funkcje. Treści prywatnych notatek, tokeny i kody logowania pozostają poza telemetrią. Konkretny zestaw narzędzi ustalamy przy wdrażaniu diagnostyki.

Początkową analitykę produktu opieramy na własnych zdarzeniach i agregatach, bez nagrywania sesji użytkowników. Mierzymy m.in. rozpoczęcie i ukończenie nauki, powroty oraz błędy zapisu; analityka nie zbiera treści prywatnych notatek.

Nieoczekiwany błąd odczytu/zapisu logujemy raz w handlerze, przed zamianą na ogólne HTTP 500. Log zachowuje pierwotną przyczynę i requestId z middleware; odpowiedź klienta nie ujawnia szczegółów bazy. Zadeklarowany błąd HTTP jest następnie kodowany do odpowiedzi, więc globalne middleware nie loguje go drugi raz. Błędy biznesowe, np. odmowa dostępu lub konflikt wersji, nie są awariami infrastruktury. Błędy klienta bez aktywnego żądania, np. bezczynnej puli PostgreSQL, zachowują własny kontekst i pełny błąd.
