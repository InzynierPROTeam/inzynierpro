# Lint i narzędzia Effect

## Uruchomienie

- `pnpm lint` uruchamia Oxlint przez `effect-tsgo` ze sprawdzaniem typów i presetem diagnostyki Effect.
- `pnpm lint:fix` jawnie stosuje dostępne poprawki. `pnpm format` formatuje, a `pnpm format:check` tylko sprawdza formatowanie.
- `pnpm type-check` sprawdza pakiety workspace przez TypeScript z integracją Effect.
- `pnpm test` obejmuje testy reguł oraz próbki uruchamiane przez rzeczywiste CLI lintera.
- `pnpm check` sprawdza format, lint, typy, testy i dostępne buildy; nie poprawia plików.

Zależności narzędzi są przypięte w katalogu pnpm. Oxlint i `@oxlint/plugins` aktualizujemy razem. Wersje TypeScript, Oxlint i oxlint-tsgolint muszą być obsługiwane przez wybraną wersję `@effect/tsgo`.

Wspólne konfiguracje lintowania należą do globalnych zależności cache Turbo. Ich zmiana unieważnia także typecheck oraz testy uruchamiające CLI z konfiguracją repo. Konfiguracja TypeScript każdego workspace należy do jego własnych wejść cache.

## Warstwy reguł

1. **Projektowe:** cztery reguły z V1: pusta linia przed return, odstępy przy control flow, importy na początku i odstęp po importach. Publiczny interfejs reguł ma testy poprawnych/naruszających przykładów, komentarzy, dyrektyw i autofixów. Przy przeniesieniu poprawiono zachowanie komentarzy i zachowanie wcięcia przy dodawaniu pustej linii.
2. **Anti-slop:** źródło pobrane bezpośrednio z `dmmulroy/anti-slop`, nie z kopii V1. Włączone są wszystkie reguły ogólne, osobny zestaw Effect i komplementarna natywna reguła `oxc/no-accumulating-spread`.
3. **Effect:** rekomendowany preset `@effect/tsgo` dostarcza diagnostykę świadomą typów, m.in. niewykorzystanych Effects, brakujących wymagań i błędów. Błędy mają wpływ na status lintera; sugestie pozostają zgodne z presetem upstream.

Upstream anti-slop zachowuje oryginalne testy i licencję MIT. `UPSTREAM.json` obok pluginu zapisuje commit i bazowe hashe upstream oraz jawne lokalne poprawki z uzasadnieniem i ich hashami. Jedyna poprawka zgodności z presetem V1 uściśla odczyt pierwszego elementu tablicy pod `noUncheckedIndexedAccess`, bez zmiany reguł. Katalog vendora jest wyłączony z własnego lintowania/formatowania, ale jego testy i typecheck są uruchamiane. Nie poprawiaj go automatycznie pod lokalne reguły. Przy aktualizacji porównaj nowy upstream, zachowaj licencję i odśwież pochodzenie; lokalne rozszerzenia trzymaj poza vendorem.

Zasoby agentów są wyłączone z lintowania jako zewnętrzne materiały, nie kod produktu.

## Konfiguracje TypeScript

Każda aplikacja lub pakiet ma jeden `tsconfig.json`, bez repozytoryjnego `tsconfig.base.json` i bez osobnych konfiguracji dla testów. Tak jak w V1, konfiguracja rozszerza bezpośrednio odpowiedni preset `@total-typescript/tsconfig` i ustawia własne opcje platformowe, katalogi oraz aliasy. Pakiet narzędzi korzysta z `tsc/no-dom/library-monorepo`; aplikacje dobierają preset odpowiedni dla swojego runtime.

Testy `*.test.ts`/`*.test.tsx` leżą obok testowanego kodu w `src` i należą do tego samego projektu TypeScript. Nie tworzymy osobnego katalogu testów ani `tsconfig.build.json`/`tsconfig.test.json`. Opcje pluginu `@effect/language-service` umieszczamy bezpośrednio w konfiguracji danego workspace, zachowując integrację Effect. Pakiet narzędzi jawnie ustawia ES2024 zgodnie z używanym runtime i przykładami reguł.

## Edytor i instalacja

`pnpm install` uruchamia `effect-tsgo patch --oxlint`, które instaluje zgodne komponenty TypeScript/Oxlint wewnątrz node_modules. Działa także w CI; pomijanie hooków Git nie pomija konfiguracji Effect. Skrypty lint/typecheck dodatkowo korzystają z jawnego wrappera `effect-tsgo`.

Workspace VS Code/Cursor wskazuje natywny TypeScript workspace według konfiguracji generowanej przez `@effect/tsgo setup`. Plugin udostępnia quick info, uzupełnianie i refaktoryzacje. `diagnostics: false` w konfiguracji językowej ogranicza duplikowanie diagnostyki zgłaszanej przez Oxlint. Faktyczne wczytanie ustawień edytora może wymagać przeładowania okna; test CLI nie dowodzi działania konkretnej instalacji edytora.

Workspace rekomenduje oficjalne rozszerzenie `oxc.oxc-vscode`; po jego zainstalowaniu diagnostyka Oxlint korzysta z lokalnego, skonfigurowanego narzędzia i ustawienia type-aware z presetu. Nie wymuszamy automatycznych poprawek przy zapisie pliku.

Rekomendowane jest również `effectful-tech.effect-vscode`, czyli osobne rozszerzenie debuggera Effect. Według przewodnika v4 zapewnia inspekcję kontekstu, fiberów i stosu spanów oraz zatrzymanie przy defect. Nie zastępuje projektowego LSP. Sprawdzenie debuggera z rzeczywistym procesem aplikacji nastąpi po utworzeniu tego procesu; nie dodajemy starszych zależności runtime z przykładów v3.

Natywne buildy Oxlint dostarczane przez tę wersję Effect wymagają na Linuxie glibc; kontener wykonujący lint nie powinien używać obrazu Alpine/musl.

Wyjątki od pięciodniowego opóźnienia instalacji dotyczą wyłącznie konkretnych przypiętych wersji zestawu Effect i jego binariów natywnych. Pozostałe wersje nadal podlegają `minimumReleaseAge`. Po upływie tego okresu wyjątki można usunąć.

Źródła: [anti-slop](https://github.com/dmmulroy/anti-slop), [Effect v4 Devtools](https://effect.website/docs/v4/getting-started/devtools), [macierz wspieranych wersji Effect tsgo](https://github.com/Effect-TS/tsgo#supported-package-versions).
