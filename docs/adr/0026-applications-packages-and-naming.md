# Organizacja aplikacji i konwencje nazw

Docelowe aplikacje to apps/api, apps/platform, apps/admin, apps/web i apps/mobile. apps/web jest publiczną witryną, a apps/platform aplikacją do nauki. HTTP i worker są entrypointami tego samego backendu w apps/api. Zaczynamy od API i platformy dla pierwszego scenariusza; pozostałe aplikacje oraz wspólne pakiety tworzymy przy rzeczywistym użyciu. Kontrakty i klient HTTP mają osobne współdzielone pakiety.

Katalogi i zwykłe pliki TypeScript stosują kebab-case, komponenty React PascalCase.tsx, a tabele i kolumny SQL snake_case. Wyjątki wymagane przez frameworki, routing i generowane pliki określamy jawnie. Mechaniczne reguły egzekwujemy narzędziami, zachowując przewidywalną strukturę dla ludzi i agentów.
