# Effect v4 and PostgreSQL through Effect SQL

The backend uses Effect v4, its HTTP and SQL modules, and PostgreSQL through @effect/sql-pg, with no ORM for our business logic. We accept that some interfaces are marked unstable; versions are pinned and upgraded deliberately after checking compatibility. SQL and transport details stay in each module's implementation.

Search starts on PostgreSQL full-text search and catalog filters, with no separate engine and no vector search. Results respect study kind, path scope and material availability. Polish-language search, indexes and ranking are tuned on an imported content sample.
