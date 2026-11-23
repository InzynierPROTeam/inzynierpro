# Product context and specification map

GitHub Issues for InzynierPROTeam/inzynierpro own delivery scope and acceptance criteria. ADRs linked below own lasting product and architecture decisions. Issues refer to those decisions rather than maintaining independent architecture specifications. CODING_STANDARDS.md holds review judgement; mechanical rules live in Oxlint. When an agreed decision changes, update its owning ADR and adjust the issue scope if needed.

- [System specification](https://github.com/InzynierPROTeam/inzynierpro/issues/1)
- [Foundation specification](https://github.com/InzynierPROTeam/inzynierpro/issues/2)
- [Onboarding, assignments and preview](https://github.com/InzynierPROTeam/inzynierpro/issues/6)
- [Stage 2: platform learning](https://github.com/InzynierPROTeam/inzynierpro/issues/46)
- [Complete written study: rounds, FSRS reviews, favourites and notes](https://github.com/InzynierPROTeam/inzynierpro/issues/48)
- [Oral study and the post-session mini-quiz](https://github.com/InzynierPROTeam/inzynierpro/issues/56)
- [Written mock exams](https://github.com/InzynierPROTeam/inzynierpro/issues/74)
- [Daily plan, learning XP, rankings and path reset](https://github.com/InzynierPROTeam/inzynierpro/issues/83)
- [Stage 3: remaining user platform features](https://github.com/InzynierPROTeam/inzynierpro/issues/120)
- [Sources, the fragment viewer and file storage](https://github.com/InzynierPROTeam/inzynierpro/issues/121)
- [Document PDF packages](https://github.com/InzynierPROTeam/inzynierpro/issues/128)
- [My chamber: district chamber choice, contacts and the oral filter](https://github.com/InzynierPROTeam/inzynierpro/issues/132)
- [Qualification process guide and personal checklist](https://github.com/InzynierPROTeam/inzynierpro/issues/136)
- [Question reports, recalled exam questions and post-exam feedback](https://github.com/InzynierPROTeam/inzynierpro/issues/141)

Before implementation read the applicable issue, glossary and ADRs. [platform.md](platform.md) describes how the web platform guards routes and loads data, [written-study.md](written-study.md) how written study sessions work, [mock-exams.md](mock-exams.md) how mock exams are configured and started, and [background-jobs.md](background-jobs.md) how the worker runs durable jobs. Treat V1 at `../inzynier-pro` as read-only reference, not an implicit V2 specification or permission to access production data. Leave changes uncommitted unless publication is explicitly requested.

## Decision map

| ADR                                                                                                                     | System specification area        |
| ----------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| [0001-independent-v2-pilot](adr/0001-independent-v2-pilot.md)                                                           | Solution; D1, D17; Out of Scope  |
| [0002-study-session-lifecycle](adr/0002-study-session-lifecycle.md)                                                     | D2, D3, D6, D15                  |
| [0003-shared-revisions-publication-and-withdrawal](adr/0003-shared-revisions-publication-and-withdrawal.md)             | D2, D7                           |
| [0004-mock-exam-lifecycle](adr/0004-mock-exam-lifecycle.md)                                                             | D3, D6                           |
| [0005-srs-evidence-and-written-oral-separation](adr/0005-srs-evidence-and-written-oral-separation.md)                   | D5, D14                          |
| [0006-oral-study-and-knowledge-check-quiz](adr/0006-oral-study-and-knowledge-check-quiz.md)                             | D4, D5                           |
| [0007-reference-sources-syllabi-and-verification](adr/0007-reference-sources-syllabi-and-verification.md)               | D7, D8, D9                       |
| [0008-written-document-groups-and-oral-categories](adr/0008-written-document-groups-and-oral-categories.md)             | D2, D10                          |
| [0009-editorial-workflow-submissions-and-ai](adr/0009-editorial-workflow-submissions-and-ai.md)                         | D10, D11, D12, D16; Out of Scope |
| [0010-learning-gamification-and-study-day](adr/0010-learning-gamification-and-study-day.md)                             | D13                              |
| [0011-required-account-and-authentication](adr/0011-required-account-and-authentication.md)                             | D1                               |
| [0012-modular-monolith-and-data-ownership](adr/0012-modular-monolith-and-data-ownership.md)                             | D15, D16                         |
| [0013-effect-v4-and-postgresql-sql](adr/0013-effect-v4-and-postgresql-sql.md)                                           | D9, D15                          |
| [0014-shared-http-contracts-and-client](adr/0014-shared-http-contracts-and-client.md)                                   | D15                              |
| [0015-monorepo-structure-toolchain-and-verification](adr/0015-monorepo-structure-toolchain-and-verification.md)         | D15, D17; Testing Decisions      |
| [0016-client-frameworks-and-online-only](adr/0016-client-frameworks-and-online-only.md)                                 | D1, D15; stories 1, 65, 78       |
| [0017-hosting-infrastructure-and-deployment](adr/0017-hosting-infrastructure-and-deployment.md)                         | D9, D17                          |
| [0018-one-time-v1-catalog-import](adr/0018-one-time-v1-catalog-import.md)                                               | D17                              |
| [0019-versioned-rich-content](adr/0019-versioned-rich-content.md)                                                       | D9                               |
| [0020-client-side-document-packages](adr/0020-client-side-document-packages.md)                                         | D9                               |
| [0021-notifications-and-material-updates](adr/0021-notifications-and-material-updates.md)                               | D14                              |
| [0022-diagnostics-and-telemetry](adr/0022-diagnostics-and-telemetry.md)                                                 | D16, D17                         |
| [0023-account-deletion-and-retention](adr/0023-account-deletion-and-retention.md)                                       | D14                              |
| [0024-chamber-directory-and-qualification-process-guide](adr/0024-chamber-directory-and-qualification-process-guide.md) | D10                              |
| [0025-configured-paths-goals-and-access](adr/0025-configured-paths-goals-and-access.md)                                 | D1, D2, D13, D15; Foundation F4  |
| [0026-api-rate-limiting](adr/0026-api-rate-limiting.md)                                                                 | D1, D15, D17                     |
| [0027-schema-ownership-and-module-layers](adr/0027-schema-ownership-and-module-layers.md)                               | D15                              |

## Stage order

After Foundation, the platform is completed first on demonstrative technical seed data: platform learning (#46), then the remaining user features (sources, PDF packages, chamber directory, qualification guide, submitting reports). Admin and editorial MCP follow, then the V1 import together with the public website and product launch, then mobile and finally Community. Each feature extends the seed with its own data; the data model follows the ADRs from the start so the import needs no rebuild. The system specification lists the stages.

## Product scope notes

- The public website has a knowledge base about obtaining a licence alongside a blog, FAQ and contact details available without signing in. Contact about the app is separate from reporting errors in specific questions.
- Every application supports light, dark and system themes.
- A first-use tutorial is planned; its flow is designed with the interface.
- The platform home is guest-only. Public onboarding at `/zacznij` and authenticated onboarding at `/pierwsze-kroki` share one wizard; the latter uses the app shell. Authentication transfers the complete URL draft into that app route. A missing selected path sends dashboard/material visits to authenticated onboarding; profile remains accessible.

## Confirmed scope changes

The confirmed interview replaces simplified Foundation path selection with dependent onboarding, mandatory versioned exam goals, active/archived assignments, one-way exam-scope extension, profile integration and application authorization. ADR-0025 records the model; ADR-0012 records CQRS; ADR-0014 records combined private queries/client caching. Onboarding choices are public until configuration persistence; concrete catalogue endpoints use cursor pages, while client-local selection is resolved against the complete assignment list (at most five, including archived assignments), fetched with an ordinary query and ordered by assignment `updated_at` descending. All dates use one UTC codec. Daily planning, gamification and path reset are specified in #83 (stage 2, #46).

Update behavior in the appropriate GitHub specification and significant decisions in ADRs. This map is an entry point, not a duplicate system specification.
