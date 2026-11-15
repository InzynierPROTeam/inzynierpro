# syntax=docker/dockerfile:1
# Build from the repository root: docker build -f apps/api/Dockerfile .

# The latest Node 26 release (ADR-0017), the major in .nvmrc.
ARG NODE_VERSION=26

FROM node:${NODE_VERSION}-alpine AS tools
ENV CI=true \
  PNPM_HOME=/pnpm \
  PATH=/pnpm:$PATH \
  pnpm_config_verify_deps_before_run=false \
  TURBO_TELEMETRY_DISABLED=1 \
  DO_NOT_TRACK=1
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
  npm install --global pnpm@latest turbo@latest
WORKDIR /repo

# Keeps only the API and the workspace packages it depends on.
FROM tools AS pruner
COPY . .
RUN turbo prune @inzpro/api --docker

FROM tools AS builder
# Manifests first, so dependencies are reinstalled only when they change.
COPY --from=pruner /repo/out/json/ .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm install --frozen-lockfile --ignore-scripts
COPY --from=pruner /repo/out/full/ .
RUN --mount=type=cache,id=inzpro-api-turbo,target=/repo/.turbo \
  turbo build --filter=@inzpro/api \
  && node apps/api/scripts/trace-runtime.ts /repo /app

FROM node:${NODE_VERSION}-alpine AS runtime
# The runtime needs only node: drop npm and npx with their dependencies.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
ENV NODE_ENV=production
# Owned by root and run as node, so the process cannot change its own code.
COPY --from=builder /app /app
WORKDIR /app/apps/api
USER node

# The worker process of the same backend: docker build --target worker -f apps/api/Dockerfile .
# SIGTERM releases the job it holds.
FROM runtime AS worker
CMD ["node", "dist/worker/main.js"]

# The HTTP API, the default target.
FROM runtime AS runner
ENV PORT=4000
EXPOSE 4000
# The start period covers migrations, which run before the server listens.
HEALTHCHECK --interval=10s --timeout=3s --start-period=60s --start-interval=2s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/api/v1/health-check" || exit 1
# Migrations run once before the server starts; a failed migration stops the deployment (ADR-0017).
CMD ["sh", "-c", "node dist/lib/migrate.js && exec node dist/main.js"]
