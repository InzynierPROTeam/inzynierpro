# Organizacja aplikacji i konwencje nazw

Docelowe aplikacje to apps/api, apps/platform, apps/admin, apps/web i apps/mobile. apps/web jest publiczną witryną, a apps/platform aplikacją do nauki. HTTP i worker są entrypointami tego samego backendu w apps/api. Zaczynamy od API i platformy dla pierwszego scenariusza; pozostałe aplikacje oraz wspólne pakiety tworzymy przy rzeczywistym użyciu. Kontrakty i klient HTTP mają osobne współdzielone pakiety.

Katalogi i zwykłe pliki TypeScript stosują kebab-case, komponenty React PascalCase.tsx, a tabele i kolumny SQL snake_case. Wyjątki wymagane przez frameworki, routing i generowane pliki określamy jawnie. Mechaniczne reguły egzekwujemy narzędziami, zachowując przewidywalną strukturę dla ludzi i agentów.

## Odpowiedzialności paczek współdzielonych

`utils` skupia funkcje ogólne, `browser-utils` adaptery Web APIs, `react-utils` integracje React, `config` publiczną konfigurację organizacji, a `ui` współdzielone UI webowe. Wąskie `domain` może udostępniać publiczne identyfikatory, pojęcia i rzeczywiście współdzielone czyste reguły. Nie przenosimy do niego prywatnych modeli ani warstw modułów z `apps/api`. Wspólny transport HTTP należy do `api-client`; aplikacje składają konfigurację i adaptery właściwe dla ich środowiska. Odczyt env pozostaje w aplikacjach.

Dopuszczamy szerokie eksporty `./*`, gdy paczka celowo udostępnia swoją zawartość, bez ręcznego dopisywania każdego pliku. Kierunki zależności i sposób importu między workspace’ami są sprawdzane osobno. Nie tworzymy barrel files. Nazwy przyszłych paczek mogą mieć ustalone odpowiedzialności i reguły przed ich utworzeniem; sama mapa nie wymaga pustych scaffoldów.

[Mapa architektury](../architecture.md) opisuje zakresy i wyjątki, a `packages/tools/src/oxlint/architecture-policy.ts` jest wykonywalnym źródłem dozwolonych kierunków zależności.

Pliki komponentów generowanych według konwencji shadcn zachowują nazwy kebab-case jako jawny wyjątek frameworkowy. Komponenty aplikacyjne nadal stosują PascalCase.
