#!/usr/bin/env bash
# berlin-flats-hunt — single hunt, notify on new pending/review listings. Pure node, no LLM.
set -uo pipefail
source "$(dirname "$0")/../lib/headless-claude.sh"

JOB="berlin-flats-hunt"
PLUGIN="$PLUGIN_CACHE/plugins/berlin-flats"
require_paths "$PLUGIN/scripts/hunt.js"

# Quiet hours: skip the run entirely (no scraping, no notify) 22:00–07:00 Berlin.
if berlin_quiet_hours; then echo "$JOB: quiet hours, skipping"; exit 0; fi

NODE="$(command -v node 2>/dev/null || echo /opt/homebrew/bin/node)"
LD="$(log_dir "$JOB")"; LOG="$LD/$(date +%Y-%m-%d_%H%M%S).log"

OUT="$(cd "$PLUGIN" && "$NODE" --experimental-sqlite scripts/hunt.js --json 2>>"$LOG")"
echo "$OUT" >> "$LOG"

# Count new pending/review listings and build a notification with python3 (always on macOS).
SUMMARY="$(printf '%s' "$OUT" | /usr/bin/python3 -c '
import sys, json
try:
    d = json.load(sys.stdin)
except Exception:
    sys.exit(0)
new = [l for l in d.get("new", []) if l.get("verdict") in ("pending", "review")]
if not new:
    sys.exit(0)
lines = [f"\U0001F3E0 {len(new)} new Berlin flat(s):"]
for l in new[:10]:
    rent = l.get("cold_rent") or "?"
    verdict = "⚠️ review" if l.get("verdict") == "review" else "✓"
    lines.append(f"• {l.get(\"title\") or \"(no title)\"} — €{rent}, {l.get(\"district\") or \"?\"} [{verdict}]\n{l.get(\"url\") or \"\"}")
print("\n".join(lines))
')"

if [ -n "$SUMMARY" ]; then
  printf '%s' "$SUMMARY" | "$NOTIFY" --silent-fail --title "Berlin Flats"
fi
echo "$JOB: done"
