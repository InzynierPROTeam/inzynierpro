# Deployment

How the API and the worker reach staging and production, and what an operator configures before the first deployment. Decisions live in [ADR-0017](adr/0017-hosting-infrastructure-and-deployment.md). The web platform's Cloudflare deployment is a separate task.

## Flow

```text
feat/* ──PR──▶ dev ──CI──▶ staging images ──Docker Hub webhook──▶ Dokploy staging
dev ────PR──▶ main ──CI──▶ production images ──Docker Hub webhook──▶ Dokploy production
```

As in V1, CI builds the images and pushes them to Docker Hub, and Docker Hub's webhook tells Dokploy to pull them. There is no custom Dokploy provider and CI holds no Dokploy credentials.

1. A push to `dev` or `main` runs `.github/workflows/check.yml`: `check` (format, lint, types, tests with coverage, build) and `e2e`.
2. Only when both pass for that commit does `deploy` run, in the GitHub environment `staging` (`dev`) or `production` (`main`). It deploys only the branch head: if the branch moved on, the newer commit's own run deploys it.
3. `deploy` builds the API and worker images and pushes `<API_IMAGE>`, then `<WORKER_IMAGE>`, as `latest` and as the commit SHA.
4. Docker Hub calls the Dokploy webhook of each application, and Dokploy pulls `latest`.
5. The API container runs the migrations, auth and module alike, in one transaction before the server starts. A failed migration rolls back and the new API never starts; the previous version keeps running. The worker does not migrate. Its image is pushed after the API's, but Dokploy deploys the two applications independently, so the new worker may start before the migration ends; a job that fails on the old schema is retried ([background-jobs.md](background-jobs.md)).

Each environment builds one deployment at a time: the `deploy` job of an environment shares a concurrency group with `cancel-in-progress: false`, so a newer merge waits for the running job and never cancels it. Of several waiting deployments GitHub keeps only the newest. Staging and production have separate groups. The job ends once the images are pushed; from there Dokploy runs its deployments of an application one after another.

As in V1, the API container is the migration step (ADR-0017). That holds while the API runs as a single replica.

Not verified until an operator has configured the environments: Dokploy, the Docker Hub webhooks, Swarm rollback on a failed start, domains and TLS, Google OAuth, Resend, backups and restore. Configuration being in the repository does not mean anything was provisioned or deployed.

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
   - Environment: the variables of `apps/api/.env.example` with this environment's values. `NODE_ENV=production`, `PORT=4000`, `DATABASE_URL` and `REDIS_URL` from steps 1–2, `BETTER_AUTH_URL` the public API origin, `TRUSTED_ORIGINS` the platform origin, `BETTER_AUTH_SECRET` (`openssl rand -base64 32`), `RESEND_API_KEY`, the Google client of this environment, `COOKIES_DOMAIN` and, behind Cloudflare, `TRUSTED_CLIENT_IP_HEADER=cf-connecting-ip`. Optional `OTEL_*` with `deployment.environment.name=staging|production`.
   - Domain: the public API host with HTTPS, container port 4000.
   - Swarm settings, update config: `{"Parallelism": 1, "Order": "start-first", "FailureAction": "rollback", "Monitor": 120000000000}`. The new task must pass the image's health check, which it reaches only after migrating, before the old one stops; a task that fails, for example on a migration, rolls back.
   - Keep one replica, so a single process migrates.
   - Enable auto deploy and copy the webhook URL.
4. **Application `worker`**: image `<WORKER_IMAGE>:latest`, registry credentials of the worker image's account with its read-only token, no domain.
   - Environment: `NODE_ENV`, `LOG_LEVEL`, `DATABASE_URL` and the optional `OTEL_*` variables only.
   - Swarm settings: the same update config. The worker has no HTTP health check, so the two-minute `Monitor` window is what catches a failed start. Two workers may overlap briefly during an update; jobs are safe with several workers ([background-jobs.md](background-jobs.md)).
   - Enable auto deploy and copy the webhook URL.
5. In each Docker Hub repository, add a webhook with the matching application's URL. Dokploy deploys only when the pushed tag matches the configured one (`latest`), so the SHA tags do not trigger a second deployment; check this on staging.

### GitHub

1. Create the environments `staging` (deployment branch `dev`) and `production` (deployment branch `main`).
2. In each, add the environment's accounts as secrets: `API_DOCKERHUB_USERNAME` and `API_DOCKERHUB_TOKEN` for the API image, `WORKER_DOCKERHUB_USERNAME` and `WORKER_DOCKERHUB_TOKEN` for the worker image, each token the read-write one. Add the variables `API_IMAGE` and `WORKER_IMAGE`: the repositories, with their account, without a tag, for example `<staging-api-account>/api-staging`.
3. Protect `dev` and `main`: changes arrive by pull request with an approval, and the checks `check` and `e2e` must pass and be up to date.

The first push to `dev` after this deploys staging. Verify the Google and email sign-in by hand ([README](../README.md#google-sign-in)) before promoting to `main`.

## Rollback

Migrations only go forward. To return to an earlier version, revert the change and merge it through `dev` and `main`, as any other change. In an emergency, point the Dokploy application at an earlier `<image>:<sha>` tag, as long as that version works with the current schema; restore the `latest` tag before the next deployment.

## Backups and restore

The databases run on the VPS, so backups must not stay on it. Required before the first public production launch (ADR-0017):

1. A backup plan: Dokploy's PostgreSQL backups on a schedule to an S3-compatible destination outside the VPS, for example a Cloudflare R2 bucket for each environment, with retention, acceptable data loss and restore time set for the product stage. Redis is not backed up: it holds Better Auth's secondary storage (session cache, pending sign-in codes) and rate limits. Losing it may make users request a new code or sign in again.
2. A successful restore test in a separate environment: restore the latest PostgreSQL backup into a new database, point a staging API at it, check `/api/v1/health-check` and sign in with an existing account. Record the date, backup and result.
3. Once R2 files and Alchemy state exist, the plan and the test cover them too, including that files referenced by restored metadata exist.

Until the restore test is recorded, production is not public, regardless of a successful deployment.
