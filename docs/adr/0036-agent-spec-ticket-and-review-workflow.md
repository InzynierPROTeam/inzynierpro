# Workflow agentów zgodny z lokalnymi skills Matta Pococka

Specyfikację i zadania przygotowujemy według lokalnych skills to-spec oraz to-tickets, zamiast tworzyć równoległy format. Specyfikacja opisuje problem, rozwiązanie, historie użytkowników, decyzje implementacyjne i testowe oraz zakres wyłączeń; uzgadniamy granice testowania zachowania. Zadania są małymi, kompletnymi przekrojami zachowania z kryteriami akceptacji i jawnymi zależnościami. Podział uzgadniamy przed publikacją w GitHub Issues zgodnie z repozytoryjną instrukcją trackera. Unikamy utrwalania ścieżek plików i kodu w zadaniach, poza dopuszczonymi przez skills fragmentami prototypów precyzującymi decyzję.

Implementację prowadzimy według implement, z TDD tam, gdzie jest właściwe, przy uzgodnionych granicach testowania. Przed połączeniem zmian wymagamy niezależnego review według code-review: osobne oceny zgodności ze standardami i specyfikacją. Autor poprawia problemy i ponawia odpowiednie kontrole, a wynik oraz nierozwiązane uwagi pozostają przy PR-ze.

Standardowe zadanie upoważnia agenta do implementacji i testów. Po weryfikacji agent pozostawia niezacommitowane zmiany do przeglądu przez użytkownika w edytorze i uwzględnia jego uwagi. Commit, push i utworzenie PR-a wymagają osobnego, jawnego zlecenia użytkownika; samo zatwierdzenie implementacji lub review nie upoważnia do publikacji. Doprecyzowanie zastępuje wcześniejszą zgodę na automatyczne commity i przygotowanie PR-a. Retrospektywa procesu może nastąpić po omówieniu uwag użytkownika.

Połączenie zatwierdza człowiek. Merge do dev automatycznie wdraża staging, a merge z dev do main produkcję zgodnie z ADR-0029. Zmiana momentu publikacji kodu nie zmienia uzgodnionego CI/CD po merge.
