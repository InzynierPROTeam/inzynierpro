# Modularny monolit z procesami HTTP i worker

Backend jest jednym systemem biznesowym z modułami o jawnej odpowiedzialności. Proces HTTP obsługuje klientów, a osobny proces workerów wykonuje prace w tle; oba korzystają z tych samych modułów i bazy PostgreSQL. Wywołują te same reguły biznesowe, a procesy można uruchamiać i skalować osobno. Taki podział umożliwia rozwój i obsługę zadań w tle bez rozdzielania systemu na osobne usługi biznesowe.
