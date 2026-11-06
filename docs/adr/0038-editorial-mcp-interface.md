# MCP jako wspólny interfejs redakcyjny

Dodajemy zdalne MCP jako kolejny interfejs backendu InżynierPRO, początkowo dostępny dla uprawnionej redakcji. Pozwala pracować nad materiałami z zewnętrznych klientów AI, takich jak ChatGPT, Claude, Codex i Claude Code, bez uzależnienia operacji redakcyjnych od jednego klienta. Rzeczywistą zgodność połączenia i uwierzytelniania sprawdzamy dla każdego wspieranego klienta.

Narzędzia MCP wywołują te same operacje aplikacyjne co panel administracyjny. Backend egzekwuje wspólne walidacje, uprawnienia i reguły wersjonowania; każda operacja działa w uprawnieniach uwierzytelnionej osoby. MCP nie otrzymuje bezpośredniego dostępu do SQL ani odrębnych reguł biznesowych. Przekazywany kontekst podlega ograniczeniom danych AI redakcyjnego opisanym w ADR-0017.

Pierwszy zakres obejmuje wyszukiwanie i pobieranie materiałów, odczyt zasad redakcyjnych oraz zapis propozycji pytań, opracowań i mini-quizów. Zatwierdzanie i publikacja początkowo pozostają w panelu admina. Dalsze zastosowania MCP rozwijamy według konkretnych potrzeb.

Przy propozycji zachowujemy autora operacji, czas, samą propozycję i rewizje źródeł, na których ją oparto. Nie wymagamy nazwy modelu ani archiwizacji rozmowy i promptów z zewnętrznego klienta. Ten minimalny ślad pozwala ocenić zgodność propozycji po zmianie źródła, ale nie obiecuje odtworzenia generowania.

Przepływ redakcyjny opieramy na zewnętrznych klientach AI połączonych przez MCP. Nie budujemy własnego czatu, integracji generowania przez API modeli ani własnego środowiska wykonywania agentów. Redakcja korzysta z posiadanych narzędzi, subskrypcji i ich możliwości pracy z innymi narzędziami, zgodnie z warunkami danego dostawcy. Ogranicza to czas implementacji i nie wymaga od produktu utrzymywania własnej integracji rozliczanej przez API modeli. Zastępuje wcześniejsze rozważanie własnego generowania w tle jako domyślnej drogi rozwoju.

Jeżeli źródło zmieniło się podczas przygotowywania propozycji, zapisujemy ją z odniesieniem do faktycznie użytej rewizji i oznaczamy potrzebę sprawdzenia zgodności. Nie przepinamy automatycznie propozycji do nowszej treści. Przed zatwierdzeniem redaktor rozstrzyga jej zgodność z aktualnym źródłem.

Treści materiałów i zgłoszeń traktujemy jako dane do opracowania, a nie instrukcje upoważniające do innych operacji. Ochronę przed prompt injection opieramy na granicach dostępu i walidacji operacji backendu, a nie wyłącznie na poleceniu dla modelu, by ignorował instrukcje w źródłach.
