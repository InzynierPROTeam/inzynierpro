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

For local development configure the client's authorized JavaScript origin as `http://localhost:8001` and its authorized redirect URI as `http://localhost:4000/api/v1/auth/callback/google`. `BETTER_AUTH_URL` is the public API origin, and `PLATFORM_ORIGIN` is the exact platform origin allowed by Better Auth and CORS. The platform's `VITE_API_URL` must point to that API and `VITE_APP_BASE_URL` to that platform. Google returns to the **API callback**, which establishes the session and redirects to the requested platform path. OAuth cancellation/failure returns to `/login` with a Polish message and retains that path for another attempt or email sign-in.

Configure staging and production separately with their exact HTTPS origins and `<BETTER_AUTH_URL>/api/v1/auth/callback/google` redirect URIs; do not reuse the V1 callback path. If the platform and API use sibling subdomains, set `COOKIES_DOMAIN` to their shared domain for the platform's server-side session reads. Use separate Google clients per environment and restrict the consent screen/test users as appropriate for that environment.

New Google identities link by normalized email only when both Google and the local account have verified it. An existing Google account ID always keeps its original owner, including when Google changes the email. Failed linking can be retried after proving the address with an email code. There is no merge/link management screen or trusted-provider bypass.

Automated Google checks cover our authorization URL configuration and callback allowlist; they do not exchange tokens or simulate Google callbacks. After configuring a real client, manually check `/login` → account chooser → Google consent → requested platform page, reload to verify the session, sign out, then try cancellation and an existing email-code account. Without these credentials and a completed browser round trip, real Google smoke remains unverified.

## Tests

Test services use separate databases and ports. Integration tests connect to real PostgreSQL and Redis; mail delivery uses an in-memory outbox. Auth tests cover our mounted routes, email sign-in into the protected API, durable session/cache integration, revocation, Redis outages, mail failures, rate-limit storage, logging and CORS. Google checks use test-only credentials to inspect authorization URLs and reject untrusted callbacks, without contacting Google. Better Auth's internal OTP and OAuth/linking behavior is left to the library's tests.

```sh
cp apps/api/.env.test.example apps/api/.env.test
cp packages/db/.env.test.example packages/db/.env.test
pnpm --filter @inzpro/api services:test:up
pnpm --filter @inzpro/api migrate:test
pnpm check
```

Stop applications with Ctrl+C. Stop services with `pnpm --filter @inzpro/api services:down` or `pnpm --filter @inzpro/api services:test:down`; both preserve volumes.
