#!/usr/bin/env python3
"""Summarize `hunt.js --json` output for Telegram notification.

Reads the hunt JSON on stdin and prints a short summary of new listings whose
verdict is `pending` or `review`. Prints nothing (exit 0) when there is nothing
actionable or the input can't be parsed, so the caller sends no notification.
"""
import sys
import json

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

new = [l for l in data.get("new", []) if l.get("verdict") in ("pending", "review")]
if not new:
    sys.exit(0)

lines = [f"\U0001F3E0 {len(new)} new Berlin flat(s):"]
for l in new[:10]:
    rent = l.get("cold_rent") or "?"
    verdict = "⚠️ review" if l.get("verdict") == "review" else "✓"
    title = l.get("title") or "(no title)"
    district = l.get("district") or "?"
    url = l.get("url") or ""
    lines.append(f"• {title} — €{rent}, {district} [{verdict}]\n{url}")
print("\n".join(lines))
