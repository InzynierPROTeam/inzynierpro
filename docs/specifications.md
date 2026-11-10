# Product context and specification map

The authoritative specifications and tasks live in GitHub Issues for InzynierPROTeam/inzynierpro.

- [System specification](https://github.com/InzynierPROTeam/inzynierpro/issues/1)
- [Foundation specification](https://github.com/InzynierPROTeam/inzynierpro/issues/2)
- [Onboarding, assignments and preview](https://github.com/InzynierPROTeam/inzynierpro/issues/6)

Before implementation read the applicable issue, glossary and ADRs. Treat V1 at `../inzynier-pro` as read-only reference, not an implicit V2 specification or permission to access production data. Leave changes uncommitted unless publication is explicitly requested.

## Decision map

| ADR                                                                                                                                           | System specification area       |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| [0001-independent-v2-pilot](adr/0001-independent-v2-pilot.md)                                                                                 | Solution; D1, D17; Out of Scope |
| [0002-study-and-exam-answer-lifecycle](adr/0002-study-and-exam-answer-lifecycle.md)                                                           | D2, D3, D6                      |
| [0003-session-references-to-shared-revisions](adr/0003-session-references-to-shared-revisions.md)                                             | D2, D7                          |
| [0004-explicit-mock-exam-pause](adr/0004-explicit-mock-exam-pause.md)                                                                         | D6                              |
| [0005-shared-rules-and-session-configuration](adr/0005-shared-rules-and-session-configuration.md)                                             | D2, D15                         |
| [0006-srs-evidence-and-learning-round-progress](adr/0006-srs-evidence-and-learning-round-progress.md)                                         | D5                              |
| [0007-oral-knowledge-checks-as-supporting-evidence](adr/0007-oral-knowledge-checks-as-supporting-evidence.md)                                 | D4, D5                          |
| [0008-written-and-oral-learning-separation](adr/0008-written-and-oral-learning-separation.md)                                                 | D5                              |
| [0009-fsrs-and-versioned-learning-evidence](adr/0009-fsrs-and-versioned-learning-evidence.md)                                                 | D5, D14                         |
| [0010-published-revisions-and-emergency-withdrawal](adr/0010-published-revisions-and-emergency-withdrawal.md)                                 | D7                              |
| [0011-verification-evidence-and-reference-syllabus](adr/0011-verification-evidence-and-reference-syllabus.md)                                 | D7, D8                          |
| [0012-shared-question-catalog-and-single-publication](adr/0012-shared-question-catalog-and-single-publication.md)                             | D7                              |
| [0013-reference-documents](adr/0013-reference-documents.md)                                                                                   | D8, D9                          |
| [0014-official-syllabus-and-its-interpretation](adr/0014-official-syllabus-and-its-interpretation.md)                                         | D8                              |
| [0015-written-document-groups-and-oral-categories](adr/0015-written-document-groups-and-oral-categories.md)                                   | D2, D10                         |
| [0016-structural-fragments-and-reference-meaning](adr/0016-structural-fragments-and-reference-meaning.md)                                     | D8, D9                          |
| [0017-internal-work-management-and-submissions](adr/0017-internal-work-management-and-submissions.md)                                         | D10, D11, D12                   |
| [0018-learning-gamification-and-study-day](adr/0018-learning-gamification-and-study-day.md)                                                   | D13                             |
| [0019-required-account-and-authentication-flow](adr/0019-required-account-and-authentication-flow.md)                                         | D1                              |
| [0020-modular-monolith-http-and-worker](adr/0020-modular-monolith-http-and-worker.md)                                                         | D15, D16                        |
| [0021-module-interfaces-data-ownership-and-client-responsibilities](adr/0021-module-interfaces-data-ownership-and-client-responsibilities.md) | D15, D16                        |
| [0022-effect-v4-and-postgresql-sql](adr/0022-effect-v4-and-postgresql-sql.md)                                                                 | D9, D15                         |
| [0023-atomic-learning-actions-and-durable-jobs](adr/0023-atomic-learning-actions-and-durable-jobs.md)                                         | D16                             |
| [0024-shared-http-contracts-and-client](adr/0024-shared-http-contracts-and-client.md)                                                         | D15                             |
| [0025-monorepo-toolchain-and-verification](adr/0025-monorepo-toolchain-and-verification.md)                                                   | D17; Testing Decisions          |
| [0026-applications-packages-and-naming](adr/0026-applications-packages-and-naming.md)                                                         | D15, D17                        |
| [0027-client-frameworks-and-language-scope](adr/0027-client-frameworks-and-language-scope.md)                                                 | D1, D15; historie 1, 65, 78     |
| [0028-shared-agent-environment-first](adr/0028-shared-agent-environment-first.md)                                                             | D17                             |
| [0029-vps-dokploy-cloudflare-and-deployment-environments](adr/0029-vps-dokploy-cloudflare-and-deployment-environments.md)                     | D17                             |
| [0030-alchemy-v2-and-r2-object-storage](adr/0030-alchemy-v2-and-r2-object-storage.md)                                                         | D9, D17                         |
| [0031-one-time-v1-catalog-import](adr/0031-one-time-v1-catalog-import.md)                                                                     | D17                             |
| [0032-versioned-rich-content-and-renderer-compatibility](adr/0032-versioned-rich-content-and-renderer-compatibility.md)                       | D9                              |
| [0033-client-side-document-packages](adr/0033-client-side-document-packages.md)                                                               | D9                              |
| [0034-notifications-and-material-updates](adr/0034-notifications-and-material-updates.md)                                                     | D14                             |
| [0035-diagnostics-from-first-vertical-slice](adr/0035-diagnostics-from-first-vertical-slice.md)                                               | D16                             |
| [0036-agent-spec-ticket-and-review-workflow](adr/0036-agent-spec-ticket-and-review-workflow.md)                                               | D17; Further Notes              |
| [0037-account-deletion-and-retention-boundary](adr/0037-account-deletion-and-retention-boundary.md)                                           | D14                             |
| [0038-editorial-mcp-interface](adr/0038-editorial-mcp-interface.md)                                                                           | D12                             |
| [0039-background-question-quality-analysis](adr/0039-background-question-quality-analysis.md)                                                 | D16; Out of Scope               |
| [0040-chamber-directory-and-qualification-process-guide](adr/0040-chamber-directory-and-qualification-process-guide.md)                       | D10                             |
| [0041-configured-paths-goals-and-access](adr/0041-configured-paths-goals-and-access.md)                                                       | D1, D2, D13, D15; Foundation F4 |

## Confirmed scope changes

The confirmed interview replaces simplified Foundation path selection with dependent onboarding, mandatory versioned exam goals, active/archived assignments, one-way exam-scope extension, profile integration and application authorization. ADR-0041 records the model; ADR-0021 records CQRS; ADR-0024 records combined private queries/client caching. Onboarding choices are public until configuration persistence; concrete catalogue endpoints use cursor pages, while private selected-path lookup is independent of the assignment list. All dates use one UTC codec. Full daily planning, gamification and destructive reset execution remain separate tasks; their unresolved rules must be specified before implementation. API/UI text and technical documentation are English; ADR prose is Polish.

Update behavior in the appropriate GitHub specification and significant decisions in ADRs. This map is an entry point, not a duplicate system specification. The archived initial outline contains superseded proposals.
