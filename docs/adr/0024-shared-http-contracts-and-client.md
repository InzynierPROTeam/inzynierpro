# Wspólne kontrakty HTTP i klient

Kontrakty żądań, odpowiedzi i błędów definiujemy raz przez Effect Schema/HttpApi. Web, admin i mobile korzystają ze wspólnego klienta opartego na tych kontraktach. Kontrakty opisują interfejs backendu; klienci nie importują jego wewnętrznych modeli ani implementacji SQL. Różnice transportu i obsługi uwierzytelnienia platform pozostają w odpowiednich adapterach. Jedno źródło kontraktów ogranicza rozbieżności klientów, zachowując niezależność od implementacji modułów.

Zwykłe wdrożenie backendu zachowuje obsługę wspieranych wersji klientów. Zmiany API wprowadzamy z uwzględnieniem okresu kompatybilności, szczególnie dla mobile. Gdy aktualizacja jest konieczna, klient otrzymuje jednoznaczny komunikat; wymagane minimum wersji ustala backend. Dokładny okres wsparcia ustalamy przed wydaniem klienta mobilnego.

## Akcje klienta i queries

Akcje w `packages/api-client/src/modules/<module>.ts` pozostają Effectami. `apiAction` udostępnia klienta wygenerowanego z kontraktu; `runApi` dostarcza skonfigurowany `HttpClient` i wykonuje Effect dopiero na granicy z kodem Promise. Timeout i inne zasady transportu należą do konfiguracji klienta HTTP.

`packages/queries/src/modules/<module>.ts` zawiera najpierw obiekt kluczy danego modułu, a pod nim fabryki query options. `effectQueryOptions` zachowuje wynik, unię błędów i literalną krotkę klucza oraz przekazuje `AbortSignal` z `queryFn` do runnera. Klient HTTP trafia do fabryki options w aplikacji. Importujemy konkretne pliki przez subpaths; nie tworzymy barrel files.

## Grupy query keys

Obiekt kluczy jest płaski: zawiera `all`, nazwane domenowo grupy i konkretne operacje. Każda grupa rozszerza bezpośrednio `all`; każde query rozszerza swój parent key. Nazwa grupy wskazuje zasób lub odpowiedzialność, a nazwa query odpowiada operacji klienta.

- `all` identyfikuje cały moduł.
- `paths()` grupuje zapytania dotyczące zbioru ścieżek, np. `getPaths(req)`.
- `path(id)` grupuje zapytania dotyczące jednej ścieżki, np. jej szczegóły, statystyki, dokumenty i preview.
- Pełny request trafia do klucza konkretnego query, żeby uwzględnić wszystkie params, query, payload i headers wpływające na wynik. Kontrakty query używają wyłącznie jawnych, serializowalnych danych; uwierzytelnienie pozostaje w adapterze HTTP.

```ts
export const studyKeys = {
  all: ['study'] as const,
  path: (userId: UserId, id: QualificationPathId) =>
    [...studyKeys.all, 'path', userId, id] as const,
  getDocuments: (userId: UserId, req: GetDocumentsRequest) =>
    [...studyKeys.path(userId, req.params.qualificationPathId), 'getDocuments', req] as const,
  getSessionPreview: (userId: UserId, req: GetSessionPreviewRequest) =>
    [...studyKeys.path(userId, req.params.qualificationPathId), 'getSessionPreview', req] as const,
}
```

Nie dokładamy ogólnych poziomów `general`, `items` ani `item` pomiędzy modułem, grupą domenową i query. Grupy powstają przy rzeczywistym użyciu; health ma grupę `status()`, a identity `session()`. Obiekt kluczy pozostaje zwykłym obiektem funkcji.

Fabryka query options przyjmuje `(httpClient, req)` i przekazuje ten sam `req` do klucza i akcji klienta. Klient HTTP, funkcje i sekrety nie są częścią klucza. Cache konta czyścimy przy wylogowaniu lub odmowie uwierzytelnienia.

Unieważnianie korzysta z parent key właściwej grupy:

```ts
await queryClient.invalidateQueries({ queryKey: studyKeys.all })
await queryClient.invalidateQueries({ queryKey: preparationKeys.paths(userId) })
await queryClient.invalidateQueries({ queryKey: studyKeys.path(userId, pathId) })
```

`path(userId, pathId)` obejmuje wszystkie query tej ścieżki, bez list i innych ścieżek. Zmiana wpływająca na kilka grup unieważnia każdą z nich jawnie. Zapis wyboru ścieżki unieważnia lookup wyboru oraz grupę przypisań `paths(userId)`, jeżeli operacja zmienia również dane listy.

## Schematy requestów i akcje klienta

Schematy części żądania — params, query, payload i headers — mieszkają w `packages/api-contracts/src/modules/<module>/requests.ts`, obok `responses.ts`. Endpointy importują te schematy i są eksportowane osobno, żeby klient mógł inferować ich requesty.

Każda akcja klienta przyjmuje jeden argument `req` typu `InferEndpointRequest<typeof Endpoint>` i przekazuje go bez przebudowywania do wygenerowanej metody. Dla endpointów bez danych wejściowych deklarujemy `req: RequestType = {}`. Parametr pozostaje jawnie typowany, a wywołujący może go pominąć. Fabryki query options mają kolejność `(httpClient, req)` i taki sam domyślny request tylko dla pustych żądań. Helper inferuje części requestu z kontraktu, tak jak w V1; nie wyprowadzamy requestu ze schematu odpowiedzi.

```ts
export const getSessionPreview = (req: GetSessionPreviewRequest) =>
  apiAction(api => api.Study.GetSessionPreview(req))

export type GetSessionPreviewRequest = InferEndpointRequest<typeof GetSessionPreviewEndpoint>
export type GetSessionPreviewRes = Effect.Success<ReturnType<typeof getSessionPreview>>
export type GetSessionPreviewError = Effect.Error<ReturnType<typeof getSessionPreview>>
```

Każda akcja jest zapisana razem ze swoimi typami w kolejności: akcja → Request → Res → Error. Dopiero potem zaczyna się kolejna akcja.

```ts
export const checkHealth = (req: CheckHealthRequest = {}) =>
  apiAction(api => api.HealthCheck.CheckHealth(req))

export type CheckHealthRequest = InferEndpointRequest<typeof CheckHealthEndpoint>
export type CheckHealthRes = Effect.Success<ReturnType<typeof checkHealth>>
export type CheckHealthError = Effect.Error<ReturnType<typeof checkHealth>>

export const checkHealthQueryOptions = (
  httpClient: HttpClient.HttpClient,
  req: CheckHealthRequest = {},
) => effectQueryOptions(healthKeys.checkHealth(req), checkHealth(req), httpClient)
```

Jeżeli kontrakt zacznie wymagać danych, TypeScript ma zgłosić błąd przy domyślnym `{}`. Usuwamy wtedy default i uzupełniamy wywołania wymaganym requestem. Nie osłabiamy inferowanego typu przez asercje, `Partial` ani opcjonalne wymagane pola. To utrzymuje gotowość klienta i queries na rozwój kontraktu bez przebudowy ich interfejsów.

## Osobiste odpowiedzi i cache

Query kategorii/dokumentów łączy katalog z postępem użytkownika w jednej odpowiedzi. URL używa wspólnego QualificationPathId, ale wynik i cache są osobiste: klucz uwzględnia konto, ścieżkę i request. Rozszerzenie, archiwizacja, zmiana celu i przyszła odpowiedź unieważniają odpowiednie grupy. Aktualny cache to TanStack Query; Redis dla danych nauki odkładamy do pomiarów. Backend sprawdza autoryzację również przy przyszłym trafieniu w cache.

Fabryki osobistych queries przyjmują `(httpClient, userId, req)`, z domyślnym `req = {}` tylko dla pustych requestów. `userId` pochodzi z uwierzytelnionego kontekstu aplikacji i służy jako wymiar cache; nie jest polem żądania HTTP ani źródłem autoryzacji backendu. Prefiksy mają postać `paths(userId)` i `path(userId, qualificationPathId)`. Opcje onboardingu pozostają wspólnym odczytem katalogowym.

Po podziale modułów `preparationKeys` grupuje onboarding, przypisania i cele, a `studyKeys` osobiste odczyty materiałów. Zapis zmieniający zakres lub stan przypisania unieważnia odpowiednią grupę ścieżki w obu modułach oraz listę przypisań. Każdy parent danych osobistych zawiera userId; to nie jest parametr HTTP.

## Paginowane kolekcje

Każda lista zasobów korzysta ze wspólnych schematów common/pagination i odpowiedzi data/meta. Klienci używają cursor; administracja offset. Fabryki list zwracają effectInfiniteQueryOptions, przekazują kursor w tym samym req.query i odczytują nextCursor/hasMore z meta. UI udostępnia pobranie kolejnej strony. Typowany req pozostaje wymagany dla żądania z query, nawet gdy jego pola paginacji są opcjonalne. Wybór bieżącej ścieżki jest osobnym query i nie zależy od aktualnie pobranej strony listy przypisań.

Podział publicznych katalogów i chronionych operacji wynika z [ADR-0041](0041-configured-paths-goals-and-access.md). Schemat requestu jest bezpośrednim aliasem istniejącego schematu, gdy nie dodaje pól; nazwa kontraktu nie wymaga ponownego Schema.Struct.

## Wspólny format dat

Wszystkie daty systemu używają jednego kodeka i typu ApiDateTime: HTTP przyjmuje i zwraca kanoniczny UTC ISO 8601 z milisekundami, a dekodowanie natychmiast daje zwalidowany Effect DateTime.Utc. Nie tworzymy odrębnych typów dla roli daty ani reguły wymuszającej północ. Użytkownik może wybrać lokalną datę i godzinę; klient konwertuje ją na UTC i odpowiada za prezentację we własnej strefie. Brak opcjonalnej daty to Option wewnątrz oraz null w JSON.
