# Deployment

How the API and the worker reach staging and production, and what an operator configures before the first deployment. Decisions live in [ADR-0017](adr/0017-hosting-infrastructure-and-deployment.md). The platform's Cloudflare state/bootstrap and domain configuration are in [infra/cloudflare/README.md](../infra/cloudflare/README.md).

## Flow

```text
feat/* ──PR──▶ dev ──CI──▶ staging images ──Docker Hub webhook──▶ Dokploy staging
dev ────PR──▶ main ──CI──▶ production images ──Docker Hub webhook──▶ Dokploy production
```

As in V1, CI builds the images and pushes them to Docker Hub, and Docker Hub's webhook tells Dokploy to pull them. There is no custom Dokploy provider and CI holds no Dokploy credentials.

1. A code push to `dev` or `main` first checks that the environment has the required public deployment variables, image names and configured deployment secrets. This preflight needs no checkout or dependencies; it receives only presence flags for secrets, never their values. Missing settings stop the run before costly jobs start. Once it passes, CI starts the full quality gates (`check`, `e2e`) and independent parallel builds: one shared API/worker image build and the environment-configured Cloudflare platform. Builds upload artifacts for this workflow run and commit; they do not publish images or change live environments. API and worker images embed the full commit SHA in `RELEASE_SHA`.
2. Once all gates and builds pass, one `deploy` job owns the environment's release queue. It skips a superseded commit before changing anything, downloads that run's artifacts and checks the platform manifest against the revision, stage and environment configuration. Staging and production have separate queues with `cancel-in-progress: false`; newer releases never cancel a running release. GitHub keeps only the newest pending release.
3. The release loads the prebuilt images and pushes `<API_IMAGE>`, then `<WORKER_IMAGE>`, as the commit SHA and `latest`. Only the `latest` webhook may trigger Dokploy; confirm its tag filter during setup. Registry credentials are used only by this release job. No build runs in the release job.
4. Dokploy pulls the images. The API container runs auth/module migrations in one transaction before listening. A failed migration rolls back and the new API never starts; the previous API remains available. The worker does not migrate. Dokploy can start it independently before the migration finishes; jobs that fail against the old schema retry ([background-jobs.md](background-jobs.md)).
5. CI polls `<VITE_API_URL>/api/v1/health-check` every two seconds, requiring HTTP 200, `status: ok` and `x-release-sha` equal to this release's full SHA. A still-healthy previous API, redirect or error cannot satisfy the gate. The response is `Cache-Control: no-store`; requests bypass caches. `scripts/wait-for-api.sh` makes at most 120 attempts with a five-second request timeout (under fourteen minutes even if every request times out).
6. Immediately after that readiness confirmation, Alchemy uploads the already built platform artifact. It never rebuilds here. A failed readiness gate blocks Cloudflare deployment and fails the release; the previous frontend remains live. The queue is held until this release finishes or fails, including the readiness wait and Cloudflare deployment. No following release may publish images while an earlier one waits.

An API migration is completed before the process can return the matching health revision. This is a deployment gate, not a database/Redis diagnostic on every health request. The worker's asynchronous Dokploy rollout is not a frontend readiness prerequisite. Before public launch, test the actual proxy/DNS, webhook filtering, start-first rollout, migration rollback and API readiness signal on staging.

As in V1, the API container is the migration step (ADR-0017). That holds while the API runs as a single replica.

Not verified until an operator has configured the environments: Dokploy, the Docker Hub webhooks, Swarm rollback on a failed start, domains and TLS, Google OAuth, Resend, backups and restore. Configuration being in the repository does not mean anything was provisioned or deployed.

## CI work selection

PRs to any branch run `pnpm check:pr`: formatting, then concurrent lint and types on one runner. PRs skip the deployment preflight and need no environment configuration. Feature branch pushes without an open PR do not trigger CI. Code pushes to `dev` and `main` run all tests with coverage, builds and E2E before the existing release gates. Integration tests remain uncached. E2E uses two workers on the same runner; independent jobs still run in parallel.

The workflow uses GitHub Actions `paths-ignore: ['docs/**']` for PRs and pushes. Changes confined to `docs/` skip the whole workflow. Any changed file outside `docs/`, including a root or workspace README, triggers the normal checks. There is no separate classification script or job.

Concurrency is per verification/build job, never per workflow. A newer revision cancels stale work on the same PR or branch, while deployment retains its separate, non-cancelling environment queue. A docs-only push does not start a workflow and therefore cannot cancel earlier verification. Before deployment, a Git diff excluding `docs/` skips a superseded code revision; an already verified release may still deploy if subsequent changes affect only `docs/`. Artifacts and readiness still refer to the original verified commit SHA.

The image job uses one Buildx Bake invocation for both Docker targets, sharing dependency installation and compilation. Its GitHub Actions layer cache stores the common stages once; images are uploaded together as `images-<sha>`. The quality, E2E and platform jobs prepare identical example environment files and share Turbo cache entries. Pure TypeScript package builds do not depend on frontend deployment variables; `apps/platform/turbo.json` includes `VITE_*` and `NODE_ENV` in the platform build hash, so changing origins rebuilds the frontend while shared compilation remains reusable. The E2E platform uses local URLs and cannot substitute for the environment-specific release artifact.

To verify savings after rollout, compare recent equivalent PR and code-push runs separately: job and step durations, total elapsed time, summed runner job durations, cancelled work and cache hits. GitHub billing rounds usage separately; summed durations are not an invoice. Compare cold and warm cache runs, and keep failed configuration/deployment runs separate from successful releases. Local checks cannot establish GitHub runner savings; measure them after merging this workflow.

## Operator setup

Do this once per environment, `staging` and `production`. Keep their data, secrets and configuration separate: separate Dokploy projects, databases, Docker Hub accounts, GitHub environments, OAuth clients and API keys. No secret belongs in the repository.

### Docker Hub

A free Docker Hub account holds one private repository, so, as in V1, every image has an account of its own: four accounts for the API and worker images of staging and production.

1. In each account, create its one private repository, for example `<staging-api-account>/api-staging`.
2. In each account, create an access token with read and write access for CI, and a read-only one for Dokploy.

### Dokploy

In a project of its own per environment:

1. **PostgreSQL 18** database service. Note its internal connection URL.
2. **Redis 7** database service with a password. Note its internal URL.
3. **Application `api`**: provider Docker, image `<API_IMAGE>:latest`, registry credentials of the API image's account with its read-only token.
   - Environment: the variables of `apps/api/.env.example` with this environment's values. `NODE_ENV=production`, `PORT=4000`, `DATABASE_URL` and `REDIS_URL` from steps 1–2, `BETTER_AUTH_URL` the public API origin, `TRUSTED_ORIGINS` the platform origin, `BETTER_AUTH_SECRET` (`openssl rand -base64 32`), `RESEND_API_KEY`, the Google client of this environment, `COOKIES_DOMAIN`, the environment's private R2 bucket as `FILE_STORAGE_ENDPOINT` (`https://<account-id>.r2.cloudflarestorage.com`), `FILE_STORAGE_REGION=auto`, `FILE_STORAGE_BUCKET` and an R2 API token's `FILE_STORAGE_ACCESS_KEY_ID` and `FILE_STORAGE_SECRET_ACCESS_KEY` with object read and write on that bucket only, and, behind Cloudflare, `TRUSTED_CLIENT_IP_HEADER=cf-connecting-ip`. Optional `OTEL_*` with `deployment.environment.name=staging|production`. The bucket's CORS policy allows `GET` and `HEAD` from the platform origin (the same value as `TRUSTED_ORIGINS`) with the `Range` request header and the `Accept-Ranges`, `Content-Length` and `Content-Range` response headers exposed, because the in-app PDF viewer reads signed file addresses directly from the browser. Local MinIO enforces the same origin rule.
   - Domain: the public API host with HTTPS, container port 4000.
   - Swarm settings, update config: `{"Parallelism": 1, "Order": "start-first", "FailureAction": "rollback", "Monitor": 120000000000}`. The new task must pass the image's health check, which it reaches only after migrating, before the old one stops; a task that fails, for example on a migration, rolls back.
   - Keep one replica, so a single process migrates. Do not override `RELEASE_SHA` in Dokploy: it is baked into the image and identifies the running code. Never cache `/api/v1/health-check` at the proxy; preserve its `x-release-sha` response header.
   - Enable auto deploy and copy the webhook URL.
4. **Application `worker`**: image `<WORKER_IMAGE>:latest`, registry credentials of the worker image's account with its read-only token, no domain.
   - Environment: `NODE_ENV`, `LOG_LEVEL`, `DATABASE_URL` and the optional `OTEL_*` variables only.
   - Swarm settings: the same update config. The worker has no HTTP health check, so the two-minute `Monitor` window is what catches a failed start. Two workers may overlap briefly during an update; jobs are safe with several workers ([background-jobs.md](background-jobs.md)).
   - Enable auto deploy and copy the webhook URL.
5. In each Docker Hub repository, add a webhook with the matching application's URL. Dokploy deploys only when the pushed tag matches the configured one (`latest`), so the SHA tags do not trigger a second deployment; check this on staging.

### GitHub

1. Create the environments `staging` (deployment branch `dev`) and `production` (deployment branch `main`).
2. In each, add the environment's accounts as secrets: `API_DOCKERHUB_USERNAME` and `API_DOCKERHUB_TOKEN` for the API image, `WORKER_DOCKERHUB_USERNAME` and `WORKER_DOCKERHUB_TOKEN` for the worker image, each token the read-write one. Add the variables `API_IMAGE` and `WORKER_IMAGE`: the repositories, with their account, without a tag, for example `<staging-api-account>/api-staging`.
3. Add the Cloudflare environment variables and secret from [infra/cloudflare/README.md](../infra/cloudflare/README.md), and bootstrap the state store separately. `build-platform` needs only public configuration; `CLOUDFLARE_API_TOKEN` is passed only to the final deployment step.
4. Changes arrive by human-approved pull request. PRs run the lightweight `check` job; full `check` and `e2e` gate deployment after merge. The private repository on GitHub Free currently has no enforced branch protection. If the plan later supports it, require PR approval and the lightweight PR check; E2E is deliberately a post-merge deployment gate.

Builds are parallel and may finish before checks; only the coordinated release promotes their artifacts. The first push to `dev` after setup deploys staging. Verify the Google and email sign-in by hand ([README](../README.md#google-sign-in)) before promoting to `main`.

## Rollback

Migrations only go forward. To return to an earlier version, revert the change and merge it through `dev` and `main`, as any other change. In an emergency, point the Dokploy application at an earlier `<image>:<sha>` tag, as long as that version works with the current schema; restore the `latest` tag before the next deployment.

## Backups and restore

The databases run on the VPS, so backups must not stay on it. Required before the first public production launch (ADR-0017):

1. A backup plan: Dokploy's PostgreSQL backups on a schedule to an S3-compatible destination outside the VPS, for example a Cloudflare R2 bucket for each environment, with retention, acceptable data loss and restore time set for the product stage. Redis is not backed up: it holds Better Auth's secondary storage (session cache, pending sign-in codes) and rate limits. Losing it may make users request a new code or sign in again.
2. A successful restore test in a separate environment: restore the latest PostgreSQL backup into a new database, point a staging API at it, check `/api/v1/health-check` and sign in with an existing account. Record the date, backup and result.
3. Once R2 files and Alchemy state exist, the plan and the test cover them too, including that files referenced by restored metadata exist.

Until the restore test is recorded, production is not public, regardless of a successful deployment.
