# VPS z Dokploy, klienci Cloudflare i środowiska wdrożeń

Wybieramy model podobny do V1: backend, PostgreSQL i Redis działają na VPS zarządzanym przy pomocy Dokploy, a klienci webowi na Cloudflare. Odrzucamy początkową propozycję preferowania zarządzanego PostgreSQL; korzystamy ze znanego modelu utrzymania. HTTP i worker uruchamiamy na Node 26 z przypiętym obrazem i zgodną konfiguracją lokalną oraz CI. Worker jest osobnym procesem tego samego backendu zgodnie z ADR-0020. Runtime klientów Cloudflare jest osobną konfiguracją.

Poza lokalnym środowiskiem planujemy jeden wspólny staging i produkcję. Automatyczne środowiska dla każdego PR odkładamy. Staging służy sprawdzeniu wdrożeń, migracji i integracji; produkcja ma osobne dane i konfigurację.

Zmiany z branchy feat/* trafiają najpierw do dev. Merge do dev automatycznie uruchamia CI/CD, budowanie i publikację środowiska staging. Po sprawdzeniu zmian merge z dev do main automatycznie uruchamia CI/CD, budowanie i wdrożenie produkcji. Wymagane kontrole jakości poprzedzają wdrożenie. Nie dokładamy osobnego ręcznego kroku wdrażania produkcji po merge; zastępuje to wcześniejszą propozycję stagingu z main i oddzielnej promocji na produkcję. Dotyczy to procesu wdrażania backendu, workera i klientów webowych; proces wydawania mobile wymaga osobnych ustaleń.

Migracje wykonujemy jako jeden kontrolowany krok środowiska przed uruchomieniem nowej wersji HTTP i workera. Niepowodzenie zatrzymuje dalsze wdrożenie. Migracje auth i własnych modułów należą do wspólnego, wersjonowanego procesu; zmiany schematu uwzględniają działającą wersję aplikacji oraz możliwość odtworzenia danych.

W danym środowisku trwa najwyżej jedno wdrożenie naraz. Nowsza wersja czeka na zakończenie poprzedniego wdrożenia; kolejny merge nie anuluje automatycznie trwających migracji lub zmian infrastruktury. Staging i produkcja mają osobne kolejki wdrożeń.

Dokploy wspiera zarządzanie usługami i może obsługiwać kopie zapasowe. Zakres kopii, retencję i odtwarzanie trzeba jawnie ustalić i sprawdzić; samo wskazanie narzędzia nie potwierdza gotowości odtworzenia danych. Stan IaC jest przechowywany na Cloudflare zgodnie z ADR-0030; szczegółowe uprawnienia wdrożeniowe pozostają do ustalenia.

Przed pierwszym publicznym uruchomieniem wymagamy ustalonego planu kopii i udanego testu odtworzenia w oddzielnym środowisku. Obejmuje to PostgreSQL, stan IaC i ochronę plików R2. Kopie bazy nie pozostają wyłącznie na tym samym VPS; sprawdzamy także dostępność plików wskazywanych przez odtworzone metadane. Retencję, dopuszczalną utratę danych i czas odtworzenia dobieramy do etapu produktu.
