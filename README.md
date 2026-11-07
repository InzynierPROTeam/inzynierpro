# InżynierPRO V2

An exam preparation platform for Polish building qualifications. The repository is currently in the specification and foundation stage.

- [System specification](https://github.com/InzynierPROTeam/inzynierpro/issues/1)
- [Foundation specification](https://github.com/InzynierPROTeam/inzynierpro/issues/2)
- [Product context and decision map](docs/specifications.md)
- [Domain glossary](GLOSSARY.md)
- [Architecture and domain decisions](docs/adr/)

Specifications and tasks live in GitHub Issues. Before starting work, read the context map and the relevant specification, including deferred scope and open decisions.

Shared development dependencies live in the root package. Run `pnpm check` to apply available lint fixes and formatting, then check types, tests, and builds. Use `pnpm check:ci` for read-only verification.

Leave implementation changes uncommitted for review in the editor. Commit, push, or open a pull request only when explicitly requested.

## Local development

Requires Node 26, pnpm 12.16.1, and Docker with Compose. From a fresh checkout:

```sh
pnpm install --frozen-lockfile
cp apps/api/.env.example apps/api/.env
cp apps/platform/.env.example apps/platform/.env
cp packages/db/.env.example packages/db/.env
pnpm --filter @inzpro/api services:up
pnpm --filter @inzpro/api migrate:latest
pnpm dev
```

Open <http://localhost:8001>; the API runs on port 4000. Migrations run explicitly, not on server restarts.

## Tests

Test services use separate databases and ports; the database integration test connects to real PostgreSQL.

```sh
cp apps/api/.env.test.example apps/api/.env.test
cp packages/db/.env.test.example packages/db/.env.test
pnpm --filter @inzpro/api services:test:up
pnpm --filter @inzpro/api migrate:test
pnpm check
```

Stop applications with Ctrl+C. Stop services with `pnpm --filter @inzpro/api services:down` or `pnpm --filter @inzpro/api services:test:down`; both preserve volumes.
