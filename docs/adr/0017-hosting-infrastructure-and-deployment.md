# Hosting, infrastructure as code and deployment

## Hosting

As in V1, the backend, PostgreSQL and Redis run on a VPS managed with Dokploy, and web clients run on Cloudflare. We rejected preferring managed PostgreSQL in favour of the known operating model. HTTP and worker run on Node 26 using the latest `node:26-alpine` patch image, with matching local and CI configuration. The worker is a separate process of the same backend (ADR-0012). Cloudflare client runtimes have their own configuration.

## Infrastructure as code

Alchemy v2 manages infrastructure, accepting that it is in beta. The version is pinned, deployments are tried on staging first, and infrastructure configuration is separate from the application. Alchemy v1 and v2 examples and interfaces are never mixed.

The initial IaC scope is Cloudflare resources. VPS services are maintained through Dokploy and versioned deployment files, with no custom Dokploy provider; Alchemy may take over Dokploy later when automation justifies it. CI/CD still deploys every environment automatically.

IaC state lives in Alchemy's shared remote Cloudflare state backend, a Worker with a Durable Object and SQLite, logically separated for staging and production. It is metadata about managed resources, independent of the application databases on the VPS. Environments are configured explicitly, with no user-dependent default names. The state store is provisioned before CI uses it; some Alchemy commands may initialize resources on first run, so `pnpm check` never runs provisioning.

## Object storage

Source documents, PDFs and images are stored in Cloudflare R2. Metadata and access rules live in PostgreSQL, and the backend uses a file-storage adapter. Staging and production have separate resources. Required operations must be checked against the S3 API subset R2 supports.

## Environments and releases

Beyond local development there is one shared staging and production; per-PR environments are postponed. Staging verifies deployments, migrations and integrations; production has its own data and configuration.

Changes from `feat/*` branches go to `dev`. Pull requests run the lightweight checks from ADR-0015. A code merge to `dev` runs full CI/CD and deploys staging. After verification, a code merge from `dev` to `main` runs full CI/CD and deploys production, with no extra manual step. Required quality checks precede every deployment. Merges changing only `docs/` do not run CI or deploy. This covers the backend, worker and web clients; mobile releases need their own process. A human approves every merge.

Migrations run as one controlled step before the new HTTP and worker versions start, and a failure stops the deployment. Auth and module migrations share one versioned process, and schema changes account for the running application version and data recovery. Each environment runs at most one deployment at a time: a newer version waits, and a later merge never cancels running migrations or infrastructure changes. Staging and production have separate deployment queues.

CI builds the API and worker images together with a shared Docker build graph, and the environment-configured platform in parallel with quality checks, publishing only workflow artifacts at this stage. One serialized release job per environment consumes those artifacts after all gates pass, pushes the API/worker images to Docker Hub and holds the queue until the matching API revision is ready and the prebuilt platform is deployed. Docker Hub webhooks make Dokploy pull the images; CI holds no Dokploy credentials. Unlike V1, frontend rollout is gated on the full image commit SHA returned by the live API health endpoint: a healthy old revision cannot unlock it. The readiness response is not cached. Migration/start failure or readiness timeout leaves the previous frontend in place. No build runs after readiness confirmation. The API container runs the migrations before the server starts; the worker does not migrate. With one API replica this is the one migration step; scaling the API to several replicas reopens this decision. [deployment.md](../deployment.md) describes the configuration.

## Backups

Dokploy can manage services and backups, but the scope, retention and restore must be decided and tested explicitly; naming a tool does not prove data can be restored. Before the first public launch we require a backup plan and a successful restore test in a separate environment, covering PostgreSQL, IaC state and R2 files. Database backups never stay only on the same VPS, and the restore test checks that files referenced by restored metadata exist. Retention, acceptable data loss and restore time match the product stage. Deployment permissions are still open.
