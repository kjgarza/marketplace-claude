#!/usr/bin/env bash
# Thin Claude Code hook launcher; deterministic validation lives in TypeScript.
set -uo pipefail
BUN_BIN="$(command -v bun 2>/dev/null || echo /opt/homebrew/bin/bun)"
"$BUN_BIN" "$(dirname "$0")/validate-message.ts"
