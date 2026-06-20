#!/usr/bin/env python3
"""Print bash command strings from a plugin hooks.json file."""
import json
import sys

hooks_json_path = sys.argv[1]
with open(hooks_json_path) as f:
    data = json.load(f)

hooks_block = data.get("hooks", data)
for event_hooks in hooks_block.values():
    if not isinstance(event_hooks, list):
        continue
    for entry in event_hooks:
        for h in entry.get("hooks", []):
            if h.get("type") == "command":
                print(h.get("command", ""))
