# InżynierPRO V2

An exam preparation platform for Polish building qualifications. The repository is currently in the specification and foundation stage.

- [System specification](https://github.com/InzynierPROTeam/inzynierpro/issues/1)
- [Foundation specification](https://github.com/InzynierPROTeam/inzynierpro/issues/2)
- [Product context and decision map](docs/specifications.md)
- [Domain glossary](GLOSSARY.md)
- [Architecture and domain decisions](docs/adr/)

Specifications and tasks live in GitHub Issues. Before starting work, read the context map and the relevant specification, including deferred scope and open decisions.

The [tooling guide](docs/agents/linting.md) covers lint configuration, rule provenance, and Effect integration. Shared development dependencies live in the root package. Run `pnpm check` for read-only verification; use `pnpm lint:fix` or `pnpm format` to apply changes explicitly.

Leave implementation changes uncommitted for review in the editor. Commit, push, or open a pull request only when explicitly requested.
