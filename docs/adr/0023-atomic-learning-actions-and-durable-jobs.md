# Atomowe skutki odpowiedzi i trwałe prace pochodne

Zapis odpowiedzi, historii, postępu sesji, SRS, realizacji celu i należnych XP wykonujemy atomowo. Po potwierdzeniu użytkownik ma spójny wynik czynności. Operacja obejmuje więcej pracy w transakcji, ale wspólna baza monolitu pozwala ją przeprowadzić przez interfejsy właścicieli danych. Ranking i inne zestawienia globalne mogą aktualizować się w tle z krótkim opóźnieniem.

Początkowo trwałe zadania opieramy na PostgreSQL, z retry, idempotentną obsługą i widocznością błędów. Transactional outbox stosujemy tam, gdzie zadanie musi powstać razem ze zmianą biznesową. Zadania przetrwają restart, a ponowienie wykonania nie może powtórzyć skutku biznesowego. Najpierw ocenimy kolejkę dostępną w Effect; osobny broker nie jest wymagany przez obecny zakres. Szczegółowy mechanizm wykonania i obsługa transakcji wymagają sprawdzenia przy referencyjnym scenariuszu.
