# Sesje wskazują współdzielone rewizje treści

Rozpoczęta sesja nauki zachowuje odwołania do konkretnych, niezmiennych rewizji pytań i zgodnych z nimi wyjaśnień. Rewizje są współdzielone między użytkownikami i sesjami; nie tworzymy osobnej kopii pełnej treści dla każdej sesji. Zwykła publikacja nowszej rewizji nie podmienia materiałów w rozpoczętej sesji, a nowe sesje korzystają z aktualnie opublikowanych materiałów.

Sesja przechowuje własny zestaw odwołań i stan pracy użytkownika. Pozwala to zachować odtwarzalność bez mnożenia kopii treści; wskazywane rewizje muszą pozostać dostępne dla historii. Jawne wycofanie błędnej rewizji jest wyjątkiem: blokuje dalsze odpowiadanie również w rozpoczętej sesji, zgodnie z ADR-0010.

## Kolejność wariantów odpowiedzi

QuestionAnswer nie przechowuje globalnej pozycji. Ekran szczegółów pytania stosuje stabilną kolejność createdAt, id; identyfikator rozstrzyga remisy czasu utworzenia.

Nauka pisemna, egzamin próbny i powtórki losują kolejność wariantów podczas tworzenia zestawu sesji. Sesja zachowuje wybraną kolejność identyfikatorów odpowiedzi dla każdego pytania. Reload, wznowienie i historia używają tej samej kolejności; nowe podejście może dostać inną permutację. Nie losujemy ponownie przy renderowaniu. Litery prezentacyjne wynikają z kolejności sesji, a ocena korzysta z identyfikatora odpowiedzi i jej przypisania do rewizji.
