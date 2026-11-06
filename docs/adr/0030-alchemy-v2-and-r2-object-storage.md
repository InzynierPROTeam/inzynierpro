# Alchemy v2 i magazyn plików R2

Wybieramy Alchemy v2, świadomie akceptując betę. Przypinamy wersję, a wdrożenie sprawdzamy najpierw na stagingu. Konfiguracja infrastruktury jest oddzielona od aplikacji. Nie mieszamy przykładów ani interfejsów Alchemy v1 i v2.

Początkowy zakres IaC obejmuje zasoby Cloudflare. Usługi VPS utrzymujemy przez Dokploy i wersjonowane pliki wdrożeniowe, bez wymagania własnego providera Dokploy w Foundation. Zawęża to początkowy zakres względem pełnej wizji infrastruktury zarządzanej przez Alchemy; CI/CD nadal automatycznie wdraża odpowiednie środowisko. Pełniejsze zarządzanie Dokploy przez Alchemy można dołożyć przy uzasadnionej potrzebie automatyzacji.

Stan IaC przechowujemy we wspólnym zdalnym backendzie Cloudflare state: Worker z Durable Object i SQLite, z logicznym rozdzieleniem stagingu i produkcji. Jest to metadany zapis zarządzanych zasobów, niezależny od baz aplikacji na VPS. Zastępuje wcześniejszą nieprzyjętą propozycję osobnej bazy PostgreSQL na stan. Korzystamy z gotowego backendu Alchemy i konfigurujemy środowiska jawnie, bez domyślnych nazw zależnych od użytkownika.

Magazyn stanu wymaga osobnego przygotowania przed korzystającym z niego CI. Weryfikujemy konfigurację dla przypiętej wersji: pierwsze uruchomienia niektórych poleceń Alchemy mogą inicjalizować zasoby. Kontrole pnpm check nie uruchamiają takiego provisioningu. Dostęp i odtwarzanie stanu należą do planu utrzymania zgodnie z ADR-0029.

Dokumenty źródłowe, PDF-y i grafiki przechowujemy w Cloudflare R2. Metadane i reguły dostępu należą do PostgreSQL, a backend korzysta z adaptera magazynu plików. Staging i produkcja mają rozdzielone zasoby. Potrzebne operacje trzeba sprawdzić względem wspieranego przez R2 zakresu API S3.
