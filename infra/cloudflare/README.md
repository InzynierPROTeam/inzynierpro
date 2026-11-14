# Cloudflare platform deployment

Issue [#14](https://github.com/InzynierPROTeam/inzynierpro/issues/14), [ADR-0017](../../docs/adr/0017-hosting-infrastructure-and-deployment.md).

This directory owns Cloudflare infrastructure, outside application code. TanStack Start remains the platform framework; authentication, authorization, SQL and business rules remain in the Node API on Dokploy. No R2 bucket is created by this slice. File storage belongs to its feature.

Alchemy and its Cloudflare provider are pinned together to **2.0.0-beta.85**, the latest release eligible under this repository's five-day dependency policy at implementation time. Do not mix v1 APIs into this stack. The official Cloudflare Vite plugin builds and previews the app; Alchemy's `Worker` uploads the prebuilt ESM modules with `bundle: false` and the client asset directory. We deliberately do not use Alchemy's Website Vite integration, which would replace the existing Cloudflare plugin. Keep compatibility date/flags aligned between `alchemy.run.ts` and `apps/platform/wrangler.json`.

## Local verification without Cloudflare credentials

```sh
pnpm install --frozen-lockfile
cp apps/platform/.env.example apps/platform/.env
pnpm exec turbo build --filter=@inzpro/platform...
pnpm --filter @inzpro/platform preview --port 8001 --strictPort
```

Open `http://localhost:8001/` and `/logowanie`. The preview uses local workerd, not a Node SSR substitute. API-backed pages require the local API and services from the root README. `pnpm test:infra` exercises the public deployment command's validation without contacting Cloudflare; `pnpm type-check:infra` checks the stack against the pinned provider. Both are included in the repository checks. `pnpm check:ci` is read-only; `pnpm check` applies the repository's usual formatting/lint fixes. Neither invokes Alchemy nor provisions infrastructure.

Wrangler's source config is local-only, without deployment routes or environment defaults. The platform's old direct Wrangler deploy script has been removed; use the explicit stage commands below.

## Environment and auth contract

Create separate local `.env.staging` / `.env.prod` files (ignored by Git), or configure environment variables in the shell. Never store credentials in source control. The `.example` files here show the required shape using reserved example domains; replace every example value before provisioning.

The public command accepts only `staging` and `prod`. Production's GitHub Environment is named `production`; its Alchemy stage is `prod`. Worker names are `inzpro-platform-staging` and `inzpro-platform-prod`; stack name `inzpro-platform` stays stable. Both stages share the `inzpro-state` state Worker, with separate stack/stage records and Durable Object SQLite state, independent of application PostgreSQL. Do not rename the stack, stage, logical resource or state Worker to rotate credentials.

Platform variables are public build inputs, not runtime secrets:

| Variable                                           | Meaning                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID`                            | Exact account owning both state and the platform; 32 hexadecimal characters                 |
| `VITE_APP_BASE_URL`                                | Platform HTTPS origin; its hostname becomes the custom domain                               |
| `VITE_API_URL`                                     | HTTPS origin of this environment's Node API                                                 |
| `VITE_MAIN_PAGE_BASE_URL`                          | Public website HTTPS origin                                                                 |
| `COOKIES_DOMAIN`                                   | Immediate common parent of API and platform hostnames, used to validate SSR cookie delivery |
| `VITE_GOOGLE_TAG_MANAGER_ID`, `VITE_META_PIXEL_ID` | Optional public tracking IDs; leave empty when unused                                       |
| `CLOUDFLARE_API_TOKEN`                             | Secret used only by the deployment CLI, never exposed as `VITE_*`                           |

The CLI requires HTTPS origins without credentials, ports, paths, query strings or fragments. API and platform must be distinct sibling hosts under the configured cookie domain. Use an isolated staging parent, for example `platform.staging.example.com` and `api.staging.example.com` with `COOKIES_DOMAIN=staging.example.com`; production can use `platform.example.com` and `api.example.com` with `COOKIES_DOMAIN=example.com`. Avoid sharing staging accounts or cookies with production. Production cookies on the parent also reach staging subdomains; use different registrable domains if browser cookie isolation must be absolute. Neither environment should share a parent with untrusted applications.

Configure the **API** separately in Dokploy:

- `NODE_ENV=production`, `BETTER_AUTH_URL` equal to `VITE_API_URL`, `TRUSTED_ORIGINS` containing the exact `VITE_APP_BASE_URL`, and `COOKIES_DOMAIN` equal to the deployment value. The API sets secure Better Auth cookies; sibling domains let the platform forward the visitor's cookie during SSR. Browser clients already use credentials-included requests and the API's allowlisted credentialed CORS.
- Separate PostgreSQL, Redis, `BETTER_AUTH_SECRET`, mail configuration and Google credentials for each environment. There are no database/auth secrets in the Cloudflare Worker.
- Google remains optional. Once domains are deployed, add `<VITE_API_URL>/api/v1/auth/callback/google` to that environment's Google Web OAuth client, with the platform origin as its authorized JavaScript origin, then set the API's `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. No callback or auth rule changes are needed in code. See the root README's Google smoke procedure.

The SSR runtime and browser use the same build-time API origin. Turbo hashes `VITE_*` and `NODE_ENV` for builds so a local/staging artifact cannot be reused for a different production origin. The deployment command sets `NODE_ENV=production` and `VITE_IS_DEV=false`.

## Bootstrap, separately from CI

Required external setup: a Cloudflare account with Workers and Durable Objects SQLite enabled, an active managed DNS zone, a Workers subdomain for the state endpoint, the intended custom platform domains, and an operator token. See Alchemy's [Cloudflare setup](https://alchemy.run/cloudflare/setup/) and [state store](https://alchemy.run/state-store/) documentation. The token needs account-scoped Workers Scripts, Secrets Store and the domain/zone permissions required to attach the custom domain; bootstrap additionally needs Durable Object/state-store permissions. Do not grant R2 access for this slice. Verify permissions against the pinned provider and your account before use.

Load the chosen environment file with your shell or secret manager, for example:

```sh
set -a
. ./.env.staging
set +a
pnpm cloudflare validate staging
pnpm cloudflare bootstrap staging
```

Bootstrap provisions/adopts **only** `inzpro-state`, its Durable Object SQLite storage and state encryption/auth secrets. The same account/store is reused for production. It is an explicit operator action; the wrapper refuses bootstrap inside CI. Retain and back up the state encryption key using the provider's supported procedure. Missing/incompatible state fails a deploy in CI mode instead of bootstrapping or upgrading it; perform state upgrades as separate operator maintenance when upgrading Alchemy. Even `alchemy plan` can provision outside CI, so it is never part of checks.

Then, with this environment still loaded:

```sh
pnpm cloudflare build staging
pnpm cloudflare deploy staging
```

`build` validates settings and produces the runtime bundle without provider access. `deploy` builds again (Turbo can reuse a matching artifact), then runs Alchemy with an explicit stage and CI safety mode. For production load `.env.prod` and use `prod`. Do not bypass the wrapper with raw Alchemy/Wrangler commands. Workers.dev and version preview URLs are disabled for the app; the operator supplies its custom domain. Do not adopt or overwrite V1 resources; these resource names are V2-specific.

## CI/CD and releases

The existing `Check` workflow runs checks and Chromium E2E against the pushed revision. Only a **push to `dev` or `main`**, after **both jobs succeed**, deploys: `dev` → staging, `main` → production. Pull requests run checks only, with no provider credentials or preview provisioning. This ticket's feature branch was explicitly requested from `main` with `main` as its merge target; the ordinary release flow remains `feat/*` → `dev` → `main` from ADR-0017.

Create GitHub Environments `staging` and `production`. Set the table's nonsecret values as environment **variables**, and `CLOUDFLARE_API_TOKEN` as an environment **secret**. Do not add required environment approvals if automatic deployment after a human-approved merge is desired. Bootstrap the state account before enabling deploys; CI does not perform it. Each environment's deployment job has its own concurrency group with `cancel-in-progress: false`; a running deployment completes before the next starts. GitHub may replace a pending run with a newer pending revision. Do not add another workflow that deploys these resources outside that concurrency group.

The deploy job checks out the triggering SHA and builds with that environment's configuration; it does not deploy a moving branch head. The stack and deployment workflow are versioned with the application. This workflow deploys only the Cloudflare platform; API/worker rollout and controlled PostgreSQL migrations remain the Dokploy deployment slice. Deploy the compatible API and migrations before exercising new platform capabilities; this stack never starts a database migration.

## Verification record and operator smoke

Verified locally on 2026-11-14: `pnpm check` exited 0 (format/lint, infrastructure and workspace types, infrastructure and workspace tests, builds); both independent Standards and Spec reviews reported no findings. Local Cloudflare preview returned HTTP 200 for `/`, `/logowanie` and the CSS asset. `pnpm cloudflare build staging` exited 0 with reserved example origins; the resulting browser bundle contained the staging API origin and no localhost API origin.

Repository checks and local build/preview establish build/runtime compatibility. They do **not** establish provisioning, DNS/TLS or live auth correctness. No Cloudflare provisioning, remote state bootstrap, production deployment, real mail delivery or Google OAuth round trip was performed as part of this implementation. Actual account/token permissions, final domains, environment variables/secrets, live API services and OAuth/mail credentials remain operator prerequisites.

After configuration, first deploy staging and record the deployed commit and URLs. Check the home and sign-in page, static assets, API health, credentialed CORS, email sign-in, a protected page and reload (SSR), sign-out/revocation, onboarding persistence and Google success/cancellation if enabled. Confirm staging reads only staging API/data, and `prod` has distinct Worker/state records and production API settings. Repeat on production only after staging verification. Before public launch complete the backup/restore exercise required by ADR-0017, including remote IaC state; this configuration does not certify recovery.
