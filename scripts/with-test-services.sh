#!/usr/bin/env bash
set -euo pipefail

api() { pnpm --filter @inzpro/api "$@"; }

trap 'api services:test:down' EXIT

api services:test:up
api migrate:test
"$@"
