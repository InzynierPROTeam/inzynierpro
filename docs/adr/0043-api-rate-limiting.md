# Ograniczanie liczby żądań API

Własne endpointy API ograniczamy algorytmem token bucket w Redis, przeniesionym z V1 do `@inzpro/redis/rate-limiter`. Skrypt Lua atomowo zużywa token, a odrzucone żądanie nie obciąża kubełka. Logowanie i kody pozostają pod limitami Better Auth, który przechowuje liczniki w tym samym Redis (ADR-0019).

Każdy handler jawnie wywołuje limit przed swoją pracą, tak jak w V1. Nie stosujemy middleware deklarowanego w kontrakcie. Obowiązują trzy progi: publiczne odczyty katalogu 120 na minutę na adres klienta, odczyty zalogowanego użytkownika 300 na minutę oraz zapisy 30 na minutę na konto. Zalogowanych liczymy po identyfikatorze konta, nie po IP, bo wiele osób za jednym NAT dzieliłoby limit. Klucze i telemetria zawierają skrót identyfikatora, a nie surowy adres lub id. Endpoint zwraca 429 `RateLimitExceeded` z nagłówkami `retry-after` i `x-ratelimit-*`, a span operacji zapisuje politykę i przekroczenie.

Przy niedostępnym Redis odczyty są obsługiwane dalej z ostrzeżeniem w logu i na spanie, a zapisy kończą się błędem serwera. Odczyty zalogowanych i tak wymagają sesji z Redis, więc w praktyce fail-open dotyczy publicznego katalogu.

Adres klienta pochodzi wyłącznie z nagłówka wskazanego w `TRUSTED_CLIENT_IP_HEADER`, na produkcji `cf-connecting-ip`. Nagłówek jest wiarygodny tylko wtedy, gdy origin przyjmuje ruch wyłącznie z Cloudflare; bez konfiguracji używamy adresu gniazda. Better Auth korzysta z tego samego nagłówka; bez niego jego limity logowania obejmują wszystkich klientów jednym licznikiem. Globalnym zabezpieczeniem przed zalewem żądań jest reguła rate limitingu Cloudflare WAF dla całego API.
