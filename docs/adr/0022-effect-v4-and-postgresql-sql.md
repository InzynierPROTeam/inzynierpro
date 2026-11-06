# Effect v4 i PostgreSQL przez Effect SQL

Backend korzysta z Effect v4, jego modułów HTTP i SQL oraz PostgreSQL przez @effect/sql-pg, bez dodatkowego ORM dla własnej logiki biznesowej. Akceptujemy oznaczenie części interfejsów jako niestabilnych; przypinamy wersje i aktualizujemy je świadomie po sprawdzeniu zgodności. Szczegóły SQL i transportu pozostają we właściwych implementacjach modułów.

Początkowo wyszukiwanie opieramy na PostgreSQL Full Text Search i filtrach katalogu, bez osobnego silnika ani wyszukiwania wektorowego. Wyniki uwzględniają rodzaj nauki, zakres ścieżki i dostępność materiału. Szczegóły polskiego wyszukiwania, indeksów i rankingu wyników sprawdzamy na zaimportowanej próbce treści.
