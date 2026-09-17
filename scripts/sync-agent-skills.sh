#!/usr/bin/env bash
# Re-vendors the addyosmani/agent-skills skills installed in .agents/skills/
# from upstream main, plus the references/ files they link to, and records the
# upstream commit in .agents/UPSTREAM. Run by .github/workflows/sync-agent-skills.yml
# on a schedule; also runnable by hand. Pass skill names to add new ones;
# with no arguments it refreshes the ones already installed.
set -euo pipefail

REPO_URL="https://github.com/addyosmani/agent-skills.git"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/.agents"

if [ "$#" -gt 0 ]; then
  skills=("$@")
else
  skills=()
  for dir in "$DEST"/skills/*/; do skills+=("$(basename "$dir")"); done
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
git clone --quiet --depth 1 "$REPO_URL" "$tmp/upstream"

for skill in "${skills[@]}"; do
  if [ ! -d "$tmp/upstream/skills/$skill" ]; then
    echo "error: skill '$skill' no longer exists upstream" >&2
    exit 1
  fi
  rm -rf "$DEST/skills/$skill"
  cp -R "$tmp/upstream/skills/$skill" "$DEST/skills/$skill"
done

# Skills link to ../../references/<file>.md, i.e. .agents/references/.
# Only the files the installed skills actually link to are vendored.
rm -rf "$DEST/references"
mkdir -p "$DEST/references"
grep -rhoE 'references/[A-Za-z0-9_-]+\.md' "$DEST/skills" | sort -u |
  while read -r ref; do
    cp "$tmp/upstream/$ref" "$DEST/references/"
  done

git -C "$tmp/upstream" rev-parse HEAD >"$DEST/UPSTREAM"

# The repo's Prettier config covers .agents/, so vendored files must match it.
(cd "$ROOT" && pnpm exec prettier --write --log-level warn .agents)
