# Wspólne kontrakty HTTP i klient

Kontrakty żądań, odpowiedzi i błędów definiujemy raz przez Effect Schema/HttpApi. Web, admin i mobile korzystają ze wspólnego klienta opartego na tych kontraktach. Kontrakty opisują interfejs backendu; klienci nie importują jego wewnętrznych modeli ani implementacji SQL. Różnice transportu i obsługi uwierzytelnienia platform pozostają w odpowiednich adapterach. Jedno źródło kontraktów ogranicza rozbieżności klientów, zachowując niezależność od implementacji modułów.

Zwykłe wdrożenie backendu zachowuje obsługę wspieranych wersji klientów. Zmiany API wprowadzamy z uwzględnieniem okresu kompatybilności, szczególnie dla mobile. Gdy aktualizacja jest konieczna, klient otrzymuje jednoznaczny komunikat; wymagane minimum wersji ustala backend. Dokładny okres wsparcia ustalamy przed wydaniem klienta mobilnego.

## Akcje klienta i queries

Akcje w `packages/api-client/src/modules/<module>/actions.ts` pozostają Effectami. `apiAction` udostępnia klienta wygenerowanego z kontraktu; `runApi` dostarcza skonfigurowany `HttpClient` i wykonuje Effect dopiero na granicy z kodem Promise. Timeout i inne zasady transportu należą do konfiguracji klienta HTTP.

`packages/queries/src/modules/<module>.ts` zawiera najpierw obiekt kluczy danego modułu, a pod nim fabryki query options. `effectQueryOptions` zachowuje wynik, unię błędów i literalną krotkę klucza oraz przekazuje `AbortSignal` z `queryFn` do runnera. Klient HTTP trafia do fabryki options w aplikacji. Importujemy konkretne pliki przez subpaths; nie tworzymy barrel files.

## Hierarchia query keys

Klucze tworzą hierarchię prefiksów, od całego modułu przez grupę do konkretnego zapytania:

- `all` jest stałą krotką identyfikującą cały moduł.
- `general()` grupuje zapytania ogólne, np. listy i podsumowania.
- `items()` grupuje wszystkie zapytania dotyczące pojedynczych elementów.
- `item(id)` grupuje wszystkie zapytania jednego elementu.
- Klucz konkretnego query rozszerza odpowiedni prefiks nazwą operacji i parametrami wpływającymi na wynik.

Przykład dla hipotetycznego modułu; `ItemId` jest typem brandowanym, a `ListFilters` typem parametrów z kontraktu tego modułu:

```ts
export const featureKeys = {
  all: ['feature'] as const,
  general: () => [...featureKeys.all, 'general'] as const,
  list: (filters: ListFilters) => [...featureKeys.general(), 'list', filters] as const,
  items: () => [...featureKeys.all, 'items'] as const,
  item: (id: ItemId) => [...featureKeys.items(), id] as const,
  detail: (id: ItemId) => [...featureKeys.item(id), 'detail'] as const,
  history: (id: ItemId) => [...featureKeys.item(id), 'history'] as const,
}
```

Fabryki query options korzystają z tych kluczy zamiast składać własne krotki. Klucze pozostają serializowalne i uwzględniają filtry, paginację oraz pozostałe parametry zmieniające odpowiedź. Klient HTTP, funkcje i sekrety nie są częścią klucza. Współdzielimy prefiksy przez zwykłe obiekty i funkcje; nie dodajemy frameworka do budowania kluczy. Grupy powstają przy rzeczywistym użyciu — health-check potrzebuje tylko `all`, `general()` i `check()`.

Unieważnianie korzysta z dopasowania prefiksu:

```ts
await queryClient.invalidateQueries({ queryKey: featureKeys.all })
await queryClient.invalidateQueries({ queryKey: featureKeys.general() })
await queryClient.invalidateQueries({ queryKey: featureKeys.item(id) })
await queryClient.invalidateQueries({ queryKey: featureKeys.detail(id), exact: true })
```

Po zmianie elementu unieważniamy jego grupę `item(id)` oraz właściwe zapytania ogólne, jeśli zmiana wpływa na listy lub agregaty. Nie zakładamy, że unieważnienie szczegółów automatycznie unieważni listę: te grupy mają różne prefiksy.
