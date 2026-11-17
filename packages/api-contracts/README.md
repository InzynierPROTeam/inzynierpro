# @inzpro/api-contracts

Public HTTP contracts for all clients.

**Runtime:** Universal JavaScript, including Node, Workers, browsers, and native clients.

Own endpoint schemas and every object that crosses HTTP: resources, request parts, responses, pagination parameters and envelopes (`utils/pagination.ts`), and declared transport errors. Build them from `@inzpro/domain` vocabulary. Keep SQL, internal backend models and UI outside this package. A resource shared by several modules' responses (for example `Specialization` inside `UserQualificationPath`) is declared in its owning module's `responses.ts` and imported from there. See [ADR-0027](../../docs/adr/0027-schema-ownership-and-module-layers.md).

Request-part schemas (params, query, payload, headers) live in `src/modules/<module>/requests.ts`, beside `responses.ts`. Endpoints import them and are exported individually so clients can infer their requests. A request schema is a direct alias of an existing schema when it adds no fields. Decisions behind the contracts are in [ADR-0014](../../docs/adr/0014-shared-http-contracts-and-client.md).

Written and oral learning have separate `written-study` and `oral-study` contract modules. Their shared session lifecycle errors, progress, count settings and note contracts belong to `learning`. The root `api.ts` composes the HTTP group. Requests, responses and errors use either `<role>.ts` or `<role>/<topic>.ts`, allowing topical nesting and creating only needed roles. The file and directory forms of a role never coexist. Larger groups may declare endpoints in `endpoints/<topic>.ts`; clients import the concrete declaration to infer requests, without re-export barrels. Alternate group filenames such as `oral-api.ts` are rejected. Semantic schema checks cover endpoint files and nested role files as well as the flat forms.

## Usage

```ts
import { HealthCheckResponse } from '@inzpro/api-contracts/modules/health/responses'
```

## Dependencies

Follow the workspace dependency directions in [policy.ts](../tools/src/oxlint/architecture-policy.ts). The [architecture guide](../../docs/architecture.md) explains package placement, test exceptions, wildcard exports, and verification.
