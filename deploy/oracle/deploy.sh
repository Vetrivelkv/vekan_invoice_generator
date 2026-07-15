#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 3 ]]; then
  echo "Usage: deploy.sh <deployment-root> <release-sha> <environment-file>" >&2
  exit 2
fi

deployment_root="$1"
release_sha="$2"
environment_file="$3"
release_dir="${deployment_root}/releases/${release_sha}"
compose_file="${release_dir}/deploy/oracle/docker-compose.prod.yml"

if [[ ! -f "${compose_file}" || ! -f "${environment_file}" ]]; then
  echo "Release or environment file is missing." >&2
  exit 1
fi

chmod 600 "${environment_file}"
export APP_IMAGE_TAG="${release_sha}"
compose=(docker compose --project-name vekan --env-file "${environment_file}" --file "${compose_file}")

"${compose[@]}" config --quiet
"${compose[@]}" build --pull app rethinkdb
"${compose[@]}" up --detach rethinkdb
"${compose[@]}" run --rm app npm run migrate
"${compose[@]}" up --detach --remove-orphans app caddy

healthy=false
for _ in {1..30}; do
  if "${compose[@]}" exec -T app node -e \
    "fetch('http://127.0.0.1:8000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then
    healthy=true
    break
  fi
  sleep 2
done

if [[ "${healthy}" != "true" ]]; then
  "${compose[@]}" logs --tail 150 app rethinkdb caddy
  echo "Deployment failed its health check." >&2
  exit 1
fi

ln -sfn "${release_dir}" "${deployment_root}/current"
find "${deployment_root}/releases" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' \
  | sort -nr \
  | tail -n +6 \
  | cut -d' ' -f2- \
  | xargs -r rm -rf

echo "Vekan release ${release_sha} deployed successfully."
