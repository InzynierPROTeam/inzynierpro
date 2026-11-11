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

## API image

`apps/api/Dockerfile` builds the production API image from the repository root:

```sh
docker build -f apps/api/Dockerfile -t inzpro-api .
```

`turbo prune` keeps only the API and its workspace packages, and `apps/api/Dockerfile.dockerignore` limits the build context. After the build, `apps/api/scripts/trace-runtime.ts` traces the files node can load from `dist/main.js` and the migrations, so the image ships those files instead of every production dependency. Files read at runtime through package exports, such as the email theme CSS, are listed in that script; add new ones there. The image runs as the `node` user without npm, applies migrations before the server starts and reports health from `/api/v1/health-check`. Configure it with the variables from `apps/api/.env.example`.

## Onboarding, paths and session preview

After applying migrations, seed the small synthetic dataset explicitly:

```sh
pnpm --filter @inzpro/api migrate:latest
pnpm --filter @inzpro/api seed:technical
```

Sign in and open `/onboarding`. Choose specialization, qualification kind, scope, exam access and a mandatory target session. The URL restores the draft; no assignment exists until confirmation. The backend validates the entire configuration and commits the assignment, initial goal and selection in one transaction. Repeated confirmation returns the existing assignment without overwriting it.

`/profile` contains the paths section: select, add, edit the exam goal, extend written/oral access to both, archive and restore. Target changes append goal versions; archive preserves history and switches to the most recently used active alternative. A past exam date does not expire access. Personal oral dates override the labelled approximate oral-planning date on the target session.

`/start` restores the selected assignment. `/study/written` shows documents with personal coverage and read-only preview; `/study/oral` currently has a truthful empty catalogue. A missing exam-part permission offers explicit free extension to both and stays on the originally requested page after access refresh. API policies enforce the same permissions independently of the UI.

The technical dataset has two chambers, two specialization/kind/scope combinations, future/ongoing-oral/closed sessions, two documents and three synthetic questions. Each question has a stable identity, an immutable published revision, exactly three options and one explanation. Path B shares one question/revision with A. Repeated seeding does not rewrite published content; the English sample uses new revision IDs when upgrading the earlier technical fixture. No V1 production data or subject-matter verification is imported.

The backend uses CQRS in one PostgreSQL database. Query/command operations depend on reader/repository ports; application policies check active membership and exam part using PostgreSQL on each material request. Each module has one `http.ts`. Personal category/document data is combined in one response and cached only by TanStack Query under account/path/request keys. Authenticated HTTP responses are private and not stored by browser/shared HTTP caches. No server-side learning-data Redis cache is introduced.

`written_question_coverage` is the persisted private read projection for the combined catalogue/progress response. This slice verifies it with isolated SQL fixtures; the subsequent answer ticket must update it atomically with real learning evidence. Creating or answering StudySessions, full daily plans, XP/rankings and reset execution remain separate tasks. No UI suggests those functions are already available.

Run this slice in the separate test environment:

```sh
scripts/with-test-services.sh pnpm --filter @inzpro/api exec vitest run src/modules/study/http.test.ts src/modules/preparation/onboarding.http.test.ts
pnpm --filter @inzpro/platform exec vitest run src/features/learning src/features/onboarding
pnpm check
```

API tests use real PostgreSQL, Redis and authenticated sessions. React tests use the actual router, client and query stack against a controlled HTTP boundary, covering URL restoration, dependent choices, explicit confirmation and denied access/extension. They do not replace the complete browser answering E2E planned for the subsequent Foundation slice.

Exam preparation is divided into `qualification-paths`, `exam-calendar`, `preparation`, `learning-content` and `study`. Public catalogue groups live at `/api/v1/qualification-paths` and `/api/v1/exam-calendar`; private groups live at `/api/v1/preparation` and `/api/v1/study`. See ADR-0021 for ownership and ADR-0041 for date/version conventions. Local PostgreSQL and Redis ports can be configured with `POSTGRES_PORT` and `REDIS_PORT` when V1 is running alongside V2.
