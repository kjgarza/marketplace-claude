#!/usr/bin/env python3
"""Check if a plugin name is registered in marketplace.json and return its source path."""
import json
import sys

marketplace_path = sys.argv[1]
plugin_name = sys.argv[2]
mode = sys.argv[3] if len(sys.argv) > 3 else "exists"

with open(marketplace_path) as f:
    data = json.load(f)

plugins = data.get("plugins", [])

if mode == "exists":
    names = [p.get("name", "") for p in plugins]
    print("yes" if plugin_name in names else "no")
elif mode == "source":
    for p in plugins:
        if p.get("name") == plugin_name:
            print(p.get("source", ""))
            break
