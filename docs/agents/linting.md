# Lint i narzędzia Effect

## Uruchomienie

- `pnpm lint` uruchamia Oxlint przez `effect-tsgo` ze sprawdzaniem typów i presetem diagnostyki Effect.
- `pnpm lint:fix` jawnie stosuje dostępne poprawki. `pnpm format` formatuje, a `pnpm format:check` tylko sprawdza formatowanie.
- `pnpm type-check` sprawdza pakiety workspace przez TypeScript z integracją Effect.
- `pnpm test` obejmuje testy reguł oraz próbki uruchamiane przez rzeczywiste CLI lintera.
- `pnpm check` sprawdza format, lint, typy, testy i dostępne buildy; nie poprawia plików.

Zależności narzędzi są przypięte w katalogu pnpm. Oxlint i `@oxlint/plugins` aktualizujemy razem. Wersje TypeScript, Oxlint i oxlint-tsgolint muszą być obsługiwane przez wybraną wersję `@effect/tsgo`.

Wspólne konfiguracje lintowania i TypeScript należą do globalnych zależności cache Turbo. Ich zmiana unieważnia także typecheck oraz testy uruchamiające CLI z konfiguracją repo.

## Warstwy reguł

1. **Projektowe:** cztery reguły z V1: pusta linia przed return, odstępy przy control flow, importy na początku i odstęp po importach. Publiczny interfejs reguł ma testy poprawnych/naruszających przykładów, komentarzy, dyrektyw i autofixów. Przy przeniesieniu poprawiono zachowanie komentarzy i zachowanie wcięcia przy dodawaniu pustej linii.
2. **Anti-slop:** źródło pobrane bezpośrednio z `dmmulroy/anti-slop`, nie z kopii V1. Włączone są wszystkie reguły ogólne, osobny zestaw Effect i komplementarna natywna reguła `oxc/no-accumulating-spread`.
3. **Effect:** rekomendowany preset `@effect/tsgo` dostarcza diagnostykę świadomą typów, m.in. niewykorzystanych Effects, brakujących wymagań i błędów. Błędy mają wpływ na status lintera; sugestie pozostają zgodne z presetem upstream.

Upstream anti-slop pozostaje niezmieniony, wraz z testami i licencją MIT. `UPSTREAM.json` obok pluginu zapisuje commit i hashe źródeł. Katalog vendora jest wyłączony z własnego lintowania/formatowania, ale jego testy i typecheck są uruchamiane. Nie poprawiaj go automatycznie pod lokalne reguły. Przy aktualizacji porównaj nowy upstream, zachowaj licencję i odśwież pochodzenie; lokalne rozszerzenia trzymaj poza vendorem.

Zasoby agentów są wyłączone z lintowania jako zewnętrzne materiały, nie kod produktu. Wspólna konfiguracja typów zawiera plugin Effect; nowe pakiety powinny ją rozszerzać i dostosować opcje platformowe.

## Edytor i instalacja

`pnpm install` uruchamia `effect-tsgo patch --oxlint`, które instaluje zgodne komponenty TypeScript/Oxlint wewnątrz node_modules. Działa także w CI; pomijanie hooków Git nie pomija konfiguracji Effect. Skrypty lint/typecheck dodatkowo korzystają z jawnego wrappera `effect-tsgo`.

Workspace VS Code/Cursor wskazuje natywny TypeScript workspace według konfiguracji generowanej przez `@effect/tsgo setup`. Plugin udostępnia quick info, uzupełnianie i refaktoryzacje. `diagnostics: false` w konfiguracji językowej ogranicza duplikowanie diagnostyki zgłaszanej przez Oxlint. Faktyczne wczytanie ustawień edytora może wymagać przeładowania okna; test CLI nie dowodzi działania konkretnej instalacji edytora.

Workspace rekomenduje oficjalne rozszerzenie `oxc.oxc-vscode`; po jego zainstalowaniu diagnostyka Oxlint korzysta z lokalnego, skonfigurowanego narzędzia i ustawienia type-aware z presetu. Nie wymuszamy automatycznych poprawek przy zapisie pliku.

Natywne buildy Oxlint dostarczane przez tę wersję Effect wymagają na Linuxie glibc; kontener wykonujący lint nie powinien używać obrazu Alpine/musl.

Wyjątki od pięciodniowego opóźnienia instalacji dotyczą wyłącznie konkretnych przypiętych wersji zestawu Effect i jego binariów natywnych. Pozostałe wersje nadal podlegają `minimumReleaseAge`. Po upływie tego okresu wyjątki można usunąć.

Źródła: [anti-slop](https://github.com/dmmulroy/anti-slop), [Effect v4 Devtools](https://effect.website/docs/v4/getting-started/devtools), [macierz wspieranych wersji Effect tsgo](https://github.com/Effect-TS/tsgo#supported-package-versions).
