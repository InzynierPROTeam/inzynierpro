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

A pre-commit hook lints and formats only the staged files. Pull requests run `pnpm check:pr`: formatting, followed by lint with the architecture and naming rules and type checking in parallel on the same runner. Pushes to `dev` and `main` run `pnpm check:ci` (including tests with coverage against real PostgreSQL and Redis and builds), alongside the separate E2E job. All gates must pass before deployment; a merge can temporarily leave the branch red. Changes confined to `docs/` skip CI and deployment; files outside `docs/`, including README files, run the normal checks. See [deployment.md](docs/deployment.md#ci-work-selection) for filtering and cancellation rules.

Every change gets two separate reviews before it merges to `dev`: **standards** (CODING_STANDARDS.md and the ADRs it links) and **spec** (the originating issue and its parent specification). The `code-review` agent skill runs both side by side against a base branch; reviewers read the issue itself rather than a copy of it.

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

Sign in at <http://localhost:8001/login>. Sign-in codes are sent through Resend: the API does not start without `RESEND_API_KEY` in `apps/api/.env`. Preview email templates with `pnpm --filter @inzpro/email email:dev` (<http://localhost:3030>). There is no test login shortcut: tests sign in through the same code flow with an in-memory email adapter.

### Google sign-in

Use a Google OAuth **Web application** client. Set both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `apps/api/.env` (server only); without the pair the API offers email sign-in only. The login page still shows Google and reports an error if the provider is unavailable. Keep credentials out of client env files and source control.

For local development configure the client's authorized JavaScript origin as `http://localhost:8001` and its authorized redirect URI as `http://localhost:4000/api/v1/auth/callback/google`. `BETTER_AUTH_URL` is the public API origin, and `TRUSTED_ORIGINS` is the comma-separated list of client origins (including the platform) allowed by Better Auth and CORS. The platform's `VITE_API_URL` must point to that API and `VITE_APP_BASE_URL` to that platform. Google returns to the **API callback**, which establishes the session and redirects to the requested platform path. OAuth cancellation/failure returns to `/login` with a Polish message and retains that path for another attempt or email sign-in.

Configure staging and production separately with their exact HTTPS origins and `<BETTER_AUTH_URL>/api/v1/auth/callback/google` redirect URIs; do not reuse the V1 callback path. If the platform and API use sibling subdomains, set `COOKIES_DOMAIN` to their shared domain for the platform's server-side session reads. Use separate Google clients per environment and restrict the consent screen/test users as appropriate for that environment.

New Google identities link by normalized email only when both Google and the local account have verified it. An existing Google account ID always keeps its original owner, including when Google changes the email. Failed linking can be retried after proving the address with an email code. There is no merge/link management screen or trusted-provider bypass.

Automated Google checks cover our authorization URL configuration and callback allowlist; they do not exchange tokens or simulate Google callbacks. After configuring a real client, manually check `/login` → account chooser → Google consent → requested platform page, reload to verify the session, sign out, then try cancellation and an existing email-code account. Without these credentials and a completed browser round trip, real Google smoke remains unverified.

## Tests

Test services use separate databases and ports. Integration tests connect to real PostgreSQL and Redis; mail delivery uses an in-memory outbox. Auth tests cover our mounted routes, email sign-in into the protected API, durable session/cache integration, revocation, Redis outages, mail failures, rate-limit storage, logging and CORS. Google checks use test-only credentials to inspect authorization URLs and reject untrusted callbacks, without contacting Google. Better Auth's internal OTP and OAuth/linking behavior is left to the library's tests.

```sh
cp apps/api/.env.test.example apps/api/.env.test
cp packages/db/.env.test.example packages/db/.env.test
pnpm check
```

`pnpm test` (and so `pnpm check`) starts fresh test PostgreSQL and Redis, applies migrations, runs the tests and removes the services, even when a test fails. Test data lives only in memory, so every run starts from an empty database. To run a single file, wrap the command the same way:

```sh
scripts/with-test-services.sh pnpm --filter @inzpro/api exec vitest run src/modules/study/http.test.ts
```

Stop applications with Ctrl+C. Stop development services with `pnpm --filter @inzpro/api services:down`; it preserves volumes.

## Background jobs

The worker is a separate process of the same backend: `pnpm --filter @inzpro/api dev:worker`. Jobs are durable in PostgreSQL. [docs/background-jobs.md](docs/background-jobs.md) describes how to add a queue, deployment and diagnosis.

## Deployment and images

Cloudflare build/preview and state bootstrap are documented in [infra/cloudflare/README.md](infra/cloudflare/README.md). The coordinated API/worker/platform release and readiness gate are in [docs/deployment.md](docs/deployment.md).

`apps/api/Dockerfile` builds the production API image from the repository root; `--target worker` builds the worker from the same sources:

```sh
docker build -f apps/api/Dockerfile -t inzpro-api .
docker build -f apps/api/Dockerfile --target worker -t inzpro-worker .
```

`turbo prune` keeps only the API and its workspace packages, and `apps/api/Dockerfile.dockerignore` limits the build context. After the build, `apps/api/scripts/trace-runtime.ts` traces the files node can load from `dist/main.js`, the worker entry points and the migrations, so the image ships those files instead of every production dependency. Files read at runtime through package exports, such as the email theme CSS, are listed in that script; add new ones there. The image runs as the `node` user without npm, applies migrations before the server starts and reports health from `/api/v1/health-check`. Configure it with the variables from `apps/api/.env.example`.

A merge to `dev` deploys staging and a merge to `main` production through Docker Hub and Dokploy; [docs/deployment.md](docs/deployment.md) describes the flow, the operator setup, rollback and the backup plan.

## Onboarding, paths and session preview

After applying migrations, seed the small development dataset explicitly:

```sh
pnpm --filter @inzpro/api migrate:latest
pnpm --filter @inzpro/api seed:technical
```

Sign in and open `/onboarding`. Choose specialization, qualification kind, scope, exam access and a mandatory target session. The URL restores the draft; no assignment exists until confirmation. The backend validates the entire configuration and commits the assignment and initial goal in one transaction; the client saves its selection locally. Repeated confirmation returns the existing assignment without overwriting it.

`/profile` contains the paths section: select, add, edit the exam goal, extend written/oral access to both, archive and restore. Target changes append goal versions; archive preserves history; each client independently falls back to its first available active assignment. A past exam date does not expire access. Personal oral dates override the labelled approximate oral-planning date on the target session.

`/start` resolves the account-scoped web cookie against the full assignment list fetched by an ordinary query. Accounts can have at most five assignments, including archived ones. A missing or invalid cookie is immediately replaced with the first active assignment. GET /preparation/paths orders assignments by assignment `updated_at` descending and is shared by profile and navigation through an ordinary query; there is no server-side selected-path table or endpoint. `/study/written` shows documents with personal coverage and read-only preview; `/study/oral` currently has a truthful empty catalogue. A missing exam-part permission offers explicit free extension to both and stays on the originally requested page after access refresh. API policies enforce the same permissions independently of the UI.

The development dataset uses Polish chamber names, construction and architectural qualifications (63 paths), two reference documents and ten authored questions with answers and explanations based on the cited legal sources. Exam session dates come from the chambers' published schedules, with later estimates flagged as unconfirmed. Each question has a stable identity and immutable published revisions: one question has a later cosmetic revision and one a substantive revision, to check how each affects learning-round coverage. Paths share questions and revisions; the second path has three Building Law questions, so its learning round can be finished by hand in a few minutes. The dataset is demonstrative: each new feature extends it with its own data until the V1 import (stage 5 of #1). Repeated seeding updates catalogue labels and upgrades the previous technical question revisions without rewriting published content. No V1 production data is imported.

The backend uses CQRS in one PostgreSQL database. Query/command operations depend on reader/repository ports; application policies check active membership and exam part using PostgreSQL on each material request. Each module has one `http.ts`. Personal category/document data is combined in one response and cached only by TanStack Query under account/path/request keys. Authenticated HTTP responses are private and not stored by browser/shared HTTP caches. No server-side learning-data Redis cache is introduced.

`written_question_coverage` is the persisted private read projection for the combined catalogue/progress response. This slice verifies it with isolated SQL fixtures; the subsequent answer ticket must update it atomically with real learning evidence. Creating or answering StudySessions, full daily plans, XP/rankings and reset execution remain separate tasks. No UI suggests those functions are already available.

Run this slice in the separate test environment:

```sh
scripts/with-test-services.sh pnpm --filter @inzpro/api exec vitest run src/modules/study/http.test.ts src/modules/preparation/onboarding.http.test.ts
pnpm --filter @inzpro/platform exec vitest run src/features/learning src/features/onboarding
pnpm check
```

API tests use real PostgreSQL, Redis and authenticated sessions. React tests use the actual router, client and query stack against a controlled HTTP boundary, covering URL restoration, dependent choices, explicit confirmation and denied access/extension. They do not replace the complete browser answering E2E planned for the subsequent Foundation slice.

Exam preparation is divided into `qualification-paths`, `exam-calendar`, `preparation`, `learning-content` and `study`. Public catalogue groups live at `/api/v1/qualification-paths` and `/api/v1/exam-calendar`; private groups live at `/api/v1/preparation` and `/api/v1/study`. See ADR-0012 for ownership, ADR-0014 for dates and ADR-0025 for goal versions. Local PostgreSQL and Redis ports can be configured with `POSTGRES_PORT` and `REDIS_PORT` when V1 is running alongside V2.
