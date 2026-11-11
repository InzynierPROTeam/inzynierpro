#!/usr/bin/env bash
# Runs a command against fresh test PostgreSQL and Redis, then removes them.
# Usage: scripts/with-test-services.sh <command...>
set -euo pipefail

api() { pnpm --filter @inzpro/api "$@"; }

trap 'api services:test:down' EXIT

api services:test:up
api migrate:test
"$@"
