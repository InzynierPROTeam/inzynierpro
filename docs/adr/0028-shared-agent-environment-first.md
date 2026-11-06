# Współdzielone środowisko agentów na start

Zaczynamy od współdzielonego środowiska pracy, zamiast uzależniać Foundation od automatycznych odizolowanych checkoutów, baz i portów dla każdego zadania agenta. Pozwala to rozpocząć rozwój z prostszą konfiguracją. Dane i ustawienia testowe pozostają rozdzielone od developerskich; współdzielenie dotyczy pracy między zadaniami, a nie mieszania środowisk lokalnych z produkcją.

Praca we wspólnym środowisku wymaga koordynacji zakresów zmian. Izolowane checkouty i osobne środowiska można dołożyć wraz z potrzebą równoległego rozwoju. Architektura produktu pozostaje niezależna od konkretnego orkiestratora agentów.
