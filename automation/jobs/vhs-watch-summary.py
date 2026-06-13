#!/usr/bin/env python3
"""Summarize `watch.ts check` output for Telegram notification.

`watch.ts check` prints a JSON array, one entry per watch:
  {watch_id, label, new_courses: [...], removed: [...], current_count,
   verification_failed?, error?}

Print a summary only when at least one watch actually changed. Exit 0 with no
output (no notification) when nothing changed or the input can't be parsed.
"""
import sys
import json

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

# Tolerate both the array form and a legacy dict form.
if isinstance(data, dict):
    watches = data.get("changes") or data.get("events") or data.get("watches") or []
elif isinstance(data, list):
    watches = data
else:
    sys.exit(0)

changed = []
for w in watches:
    if not isinstance(w, dict):
        continue
    if w.get("verification_failed"):
        continue
    new_courses = w.get("new_courses") or []
    removed = w.get("removed") or []
    if new_courses or removed:
        changed.append((w, len(new_courses), len(removed)))

if not changed:
    sys.exit(0)

total = sum(n + r for _, n, r in changed)
lines = [f"\U0001F4DA VHS Berlin: {total} change(s)"]
for w, n, r in changed[:15]:
    label = w.get("label") or f"watch {w.get('watch_id')}"
    parts = []
    if n:
        parts.append(f"+{n} new")
    if r:
        parts.append(f"-{r} gone")
    lines.append(f"• {label}: {', '.join(parts)}")
print("\n".join(lines))
