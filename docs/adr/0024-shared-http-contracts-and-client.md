# Wspólne kontrakty HTTP i klient

Kontrakty żądań, odpowiedzi i błędów definiujemy raz przez Effect Schema/HttpApi. Web, admin i mobile korzystają ze wspólnego klienta opartego na tych kontraktach. Kontrakty opisują interfejs backendu; klienci nie importują jego wewnętrznych modeli ani implementacji SQL. Różnice transportu i obsługi uwierzytelnienia platform pozostają w odpowiednich adapterach. Jedno źródło kontraktów ogranicza rozbieżności klientów, zachowując niezależność od implementacji modułów.

Zwykłe wdrożenie backendu zachowuje obsługę wspieranych wersji klientów. Zmiany API wprowadzamy z uwzględnieniem okresu kompatybilności, szczególnie dla mobile. Gdy aktualizacja jest konieczna, klient otrzymuje jednoznaczny komunikat; wymagane minimum wersji ustala backend. Dokładny okres wsparcia ustalamy przed wydaniem klienta mobilnego.
