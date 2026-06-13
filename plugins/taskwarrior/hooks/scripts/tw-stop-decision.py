#!/usr/bin/env python3
"""Emit the Stop-hook block decision as JSON.

Usage: tw-stop-decision.py <active_count> <active_list>
Kept as a helper script (not an inline `python3 -c`) per the repo's
no-multiline-python rule (CLAUDE.md:57).
"""
import json
import sys

n = sys.argv[1] if len(sys.argv) > 1 else "0"
lst = sys.argv[2] if len(sys.argv) > 2 else ""

reason = (
    f"{n} Taskwarrior task(s) are still ACTIVE. Per the task-workflow lifecycle, "
    "before finishing you must either close them (task <id> done), or stop + "
    'annotate remaining work (task <id> stop; task <id> annotate "...").\n'
    f"Active:\n{lst}\n"
    "If this work is genuinely incomplete and you are intentionally pausing, "
    "annotate the reason then stop the timer."
)
print(json.dumps({"decision": "block", "reason": reason}))
