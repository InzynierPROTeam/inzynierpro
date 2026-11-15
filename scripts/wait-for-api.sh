#!/usr/bin/env bash
# Wait for the exact API image, not an old replica that still answers health checks.
set -euo pipefail

api_origin=${1:?API origin is required}
revision=${2:?Expected release SHA is required}
attempts=${RELEASE_MAX_ATTEMPTS:-120}
interval=${RELEASE_POLL_INTERVAL:-2}
if [[ ! "$revision" =~ ^[a-f0-9]{40}$ || ! "$attempts" =~ ^[1-9][0-9]*$ || ! "$interval" =~ ^[0-9]+$ ]]; then
  echo 'Invalid readiness configuration.' >&2
  exit 1
fi

response_dir=$(mktemp -d)
trap 'rm -rf "$response_dir"' EXIT

for ((attempt = 1; attempt <= attempts; attempt++)); do
  status=$(curl --silent --show-error --max-time 5 \
    --header 'Cache-Control: no-cache' \
    --dump-header "$response_dir/headers" --output "$response_dir/body" \
    --write-out '%{http_code}' "${api_origin%/}/api/v1/health-check") || status=000
  observed=$(awk 'tolower($1) == "x-release-sha:" { gsub("\r", "", $2); print $2 }' "$response_dir/headers")
  if [[ "$status" = 200 && "$observed" = "$revision" ]] && \
    jq --exit-status '.status == "ok"' "$response_dir/body" > /dev/null 2>&1; then
    echo "API ready at revision $revision"
    exit 0
  fi
  if ((attempt < attempts)); then
    sleep "$interval"
  fi
done

echo "API did not become ready at revision $revision; platform deployment is blocked." >&2
exit 1
