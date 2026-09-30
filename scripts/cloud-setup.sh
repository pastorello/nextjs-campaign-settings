#!/usr/bin/env bash
#
# Prepares a fresh Linux container — a Claude Code cloud session, or any
# Ubuntu/Debian box without Docker — to run this repo's whole Definition of
# Done, E2E included. See docs/TESTING.md §E2E, "Cloud sessions".
#
# What it does, idempotently (safe to run again):
#   1. installs and starts a local Postgres, if there is none;
#   2. creates a dev database and a separate E2E database in it;
#   3. writes `.env` and `.env.test` if they do not exist — never overwrites;
#   4. installs dependencies, generates the Prisma client, and applies
#      migrations and the seed to both databases;
#   5. installs Playwright's Chromium — or, where its CDN is blocked, points
#      .env.test at the container's own.
#
# Everything here is throwaway and container-local: the credentials are the
# same fixed ones CI uses (.github/workflows/ci.yml), the databases hold only
# the seed, and nothing touches the DM's real campaign data, which lives on
# the maintainer's own machine and stays there.
#
# Needs network access to the Ubuntu/Debian archive and the npm registry.

set -euo pipefail

cd "$(dirname "$0")/.."

PG_USER="admin"
PG_PASSWORD="postgres"
PG_HOST="localhost"
PG_PORT="5432"
DEV_DB="campaign_settings"
E2E_DB="campaign_settings_e2e"
UPLOAD_DIR_DEFAULT="/tmp/campaign-settings-uploads"

# Root in most containers; fall back to sudo where we are not.
if [ "$(id -u)" -eq 0 ]; then
  SUDO=""
  AS_POSTGRES=(runuser -u postgres --)
else
  SUDO="sudo"
  AS_POSTGRES=(sudo -u postgres)
fi

log() { printf '\n==> %s\n' "$*"; }

database_url() {
  printf 'postgresql://%s:%s@%s:%s/%s' \
    "$PG_USER" "$PG_PASSWORD" "$PG_HOST" "$PG_PORT" "$1"
}

# --- 1. Postgres ------------------------------------------------------------

if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  log "Installing Postgres"
  $SUDO apt-get update -qq
  DEBIAN_FRONTEND=noninteractive $SUDO apt-get install -y -qq postgresql
fi

log "Starting Postgres"
$SUDO service postgresql start >/dev/null

for _ in $(seq 1 30); do
  if pg_isready -h "$PG_HOST" -p "$PG_PORT" -q; then break; fi
  sleep 1
done
pg_isready -h "$PG_HOST" -p "$PG_PORT" -q || {
  echo "Postgres did not become ready on $PG_HOST:$PG_PORT" >&2
  exit 1
}

# --- 2. Role and databases --------------------------------------------------

log "Creating role and databases"
"${AS_POSTGRES[@]}" psql -v ON_ERROR_STOP=1 -q <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$PG_USER') THEN
    CREATE ROLE $PG_USER LOGIN SUPERUSER PASSWORD '$PG_PASSWORD';
  END IF;
END
\$\$;
SQL

for db in "$DEV_DB" "$E2E_DB"; do
  exists=$("${AS_POSTGRES[@]}" psql -tAc \
    "SELECT 1 FROM pg_database WHERE datname = '$db'")
  if [ "$exists" != "1" ]; then
    "${AS_POSTGRES[@]}" createdb -O "$PG_USER" "$db"
  fi
done

# --- 3. Env files -----------------------------------------------------------
# Never overwritten: if a session already wrote its own, it wins. The two
# DATABASE_URLs must differ — playwright.config.ts refuses to start otherwise
# (TD-65) — and they do, by database name.

if [ ! -f .env ]; then
  log "Writing .env"
  cat > .env <<ENV
DATABASE_URL="$(database_url "$DEV_DB")"
AUTH_SECRET="$(openssl rand -base64 32)"
UPLOAD_DIR="$UPLOAD_DIR_DEFAULT"
ENV
fi

if [ ! -f .env.test ]; then
  log "Writing .env.test"
  printf 'DATABASE_URL="%s"\n' "$(database_url "$E2E_DB")" > .env.test
fi

mkdir -p "$UPLOAD_DIR_DEFAULT"

# --- 4. Dependencies, schema, seed ------------------------------------------

log "Installing dependencies"
corepack enable >/dev/null 2>&1 || true
pnpm install --frozen-lockfile
pnpm prisma generate

# `migrate deploy`, never `db push`: the faction table is filled by a raw-SQL
# INSERT inside a migration, and `db push` skips it, so the seed then fails
# on npc's foreign key (TD-73).
for db in "$DEV_DB" "$E2E_DB"; do
  log "Migrating and seeding $db"
  DATABASE_URL="$(database_url "$db")" pnpm prisma migrate deploy
  DATABASE_URL="$(database_url "$db")" pnpm db:seed
done

# --- 5. Playwright ----------------------------------------------------------
# `--with-deps` here, unlike CI: a bare container is not the ubuntu-latest
# runner image, and cannot be assumed to ship Chromium's system libraries.
#
# A Claude Code cloud container's egress proxy blocks cdn.playwright.dev
# (403), so the download fails there — but the image ships a Chromium of its
# own under $PLAYWRIGHT_BROWSERS_PATH. When the download fails and that
# binary exists, .env.test is pointed at it (playwright.config.ts, note 5):
# the key is appended only if absent, so a session's own value still wins.

log "Installing Playwright Chromium"
PREINSTALLED_CHROMIUM="${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}/chromium"

install_chromium() {
  if [ -n "$SUDO" ]; then
    $SUDO pnpm exec playwright install-deps chromium &&
      pnpm exec playwright install chromium
  else
    pnpm exec playwright install --with-deps chromium
  fi
}

if ! install_chromium; then
  if [ ! -x "$PREINSTALLED_CHROMIUM" ]; then
    echo "Playwright could not download Chromium, and there is no" \
      "pre-installed one at $PREINSTALLED_CHROMIUM." >&2
    exit 1
  fi
  log "Download failed; using the container's Chromium ($("$PREINSTALLED_CHROMIUM" --version))"
  if ! grep -q '^PLAYWRIGHT_CHROMIUM_EXECUTABLE=' .env.test; then
    [ -z "$(tail -c 1 .env.test)" ] || echo >> .env.test
    printf 'PLAYWRIGHT_CHROMIUM_EXECUTABLE="%s"\n' "$PREINSTALLED_CHROMIUM" >> .env.test
  fi
fi

log "Ready. Check with: pnpm typecheck && pnpm test && pnpm test:e2e e2e/map.spec.ts --project=chromium"
