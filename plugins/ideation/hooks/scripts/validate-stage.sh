#!/usr/bin/env bash
# Thin Claude Code hook launcher; deterministic validation lives in TypeScript.
set -uo pipefail
# Resolve Bun across PATH and the common install dirs (Apple Silicon + Intel
# Homebrew, ~/.bun), since non-interactive hooks may run with a bare PATH.
BUN_BIN="$(command -v bun 2>/dev/null || true)"
for c in "${HOME:-}/.bun/bin/bun" /opt/homebrew/bin/bun /usr/local/bin/bun; do
  [ -n "$BUN_BIN" ] && break
  [ -x "$c" ] && BUN_BIN="$c"
done
: "${BUN_BIN:=bun}"
"$BUN_BIN" "$(dirname "$0")/validate-stage.ts"
