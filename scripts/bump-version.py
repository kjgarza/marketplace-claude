#!/usr/bin/env python3
"""Bump semver in marketplace.json and optional plugin.json."""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
MARKETPLACE = ROOT / ".claude-plugin" / "marketplace.json"


def parse_semver(v: str) -> tuple[int, int, int]:
    parts = v.split(".")
    return int(parts[0]), int(parts[1]), int(parts[2])


def bump(v: str, part: str) -> str:
    major, minor, patch = parse_semver(v)
    if part == "major":
        return f"{major + 1}.0.0"
    if part == "minor":
        return f"{major}.{minor + 1}.0"
    if part == "patch":
        return f"{major}.{minor}.{patch + 1}"
    raise ValueError(f"unknown part: {part}")


def write_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


def bump_marketplace(part: str) -> None:
    data = json.loads(MARKETPLACE.read_text())
    old = data["metadata"]["version"]
    new = bump(old, part)
    data["metadata"]["version"] = new
    write_json(MARKETPLACE, data)
    print(f"marketplace: {old} → {new}")


def bump_plugin(name: str, part: str) -> None:
    data = json.loads(MARKETPLACE.read_text())
    plugins = data["plugins"]
    for p in plugins:
        if p["name"] == name:
            old = p["version"]
            new = bump(old, part)
            p["version"] = new
            write_json(MARKETPLACE, data)
            print(f"plugin {name}: {old} → {new}")
            manifests = [
                ROOT / "plugins" / name / ".claude-plugin" / "plugin.json",
                ROOT / "plugins" / name / "plugin.json",  # legacy path
            ]
            updated_any = False
            for plugin_json in manifests:
                if not plugin_json.exists():
                    continue
                pdata = json.loads(plugin_json.read_text())
                pdata["version"] = new
                write_json(plugin_json, pdata)
                print(f"  updated {plugin_json.relative_to(ROOT)}")
                updated_any = True

            if not updated_any:
                print("  no plugin.json manifest found (marketplace.json only)")
            return
    print(f"ERROR: plugin '{name}' not found in marketplace.json", file=sys.stderr)
    sys.exit(1)


def list_plugins() -> None:
    data = json.loads(MARKETPLACE.read_text())
    for p in data["plugins"]:
        print(p["name"])


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "marketplace":
        part = sys.argv[2] if len(sys.argv) > 2 else "patch"
        bump_marketplace(part)
    elif cmd == "plugin":
        if len(sys.argv) < 4:
            print("usage: bump-version.py plugin <name> <patch|minor|major>", file=sys.stderr)
            sys.exit(1)
        bump_plugin(sys.argv[2], sys.argv[3])
    elif cmd == "list":
        list_plugins()
    else:
        print("usage: bump-version.py <marketplace|plugin|list> [args]", file=sys.stderr)
        sys.exit(1)
