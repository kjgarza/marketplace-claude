#!/usr/bin/env python3
"""
Pre-commit / CI check: if any file under plugins/<name>/ is staged (or changed
vs a base ref), the plugin's version in marketplace.json must also have changed.

Usage:
  pre-commit mode (default):
    python3 scripts/check-version-bumped.py

  CI mode (compare HEAD against a base branch/sha):
    python3 scripts/check-version-bumped.py --base origin/main
"""

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
MARKETPLACE = ROOT / ".claude-plugin" / "marketplace.json"


def run(cmd: list[str]) -> str:
    return subprocess.check_output(cmd, cwd=ROOT, text=True).strip()


def get_staged_plugin_names() -> set[str]:
    """Files staged for commit under plugins/<name>/."""
    output = run(["git", "diff", "--cached", "--name-only"])
    return _plugin_names_from_paths(output.splitlines())


def get_changed_plugin_names(base: str) -> set[str]:
    """Files changed between base ref and HEAD under plugins/<name>/."""
    output = run(["git", "diff", "--name-only", base, "HEAD"])
    return _plugin_names_from_paths(output.splitlines())


def _plugin_names_from_paths(paths: list[str]) -> set[str]:
    names: set[str] = set()
    for p in paths:
        parts = Path(p).parts
        if len(parts) >= 2 and parts[0] == "plugins":
            names.add(parts[1])
    return names


def version_changed_staged(plugin_name: str) -> bool:
    """True if marketplace.json version for this plugin differs between HEAD and staged index."""
    try:
        head_json = run(["git", "show", "HEAD:.claude-plugin/marketplace.json"])
    except subprocess.CalledProcessError:
        return True  # new repo with no commits yet
    try:
        # Read from git index (staged), not the working tree
        index_json = run(["git", "show", ":.claude-plugin/marketplace.json"])
    except subprocess.CalledProcessError:
        return True
    head_data = json.loads(head_json)
    index_data = json.loads(index_json)
    head_ver = _plugin_version(head_data, plugin_name)
    index_ver = _plugin_version(index_data, plugin_name)
    return head_ver != index_ver


def version_changed_vs_base(plugin_name: str, base: str) -> bool:
    """True if marketplace.json version for this plugin differs between base and HEAD."""
    try:
        base_json = run(["git", "show", f"{base}:.claude-plugin/marketplace.json"])
    except subprocess.CalledProcessError:
        return True
    base_data = json.loads(base_json)
    head_json = run(["git", "show", f"HEAD:.claude-plugin/marketplace.json"])
    head_data = json.loads(head_json)
    base_ver = _plugin_version(base_data, plugin_name)
    head_ver = _plugin_version(head_data, plugin_name)
    return base_ver != head_ver


def _plugin_version(data: dict, name: str) -> str | None:
    for p in data.get("plugins", []):
        if p.get("name") == name:
            return p.get("version")
    return None


def main() -> None:
    base: str | None = None
    if "--base" in sys.argv:
        idx = sys.argv.index("--base")
        if idx + 1 >= len(sys.argv):
            print("usage: check-version-bumped.py --base <ref>", file=sys.stderr)
            sys.exit(1)
        base = sys.argv[idx + 1]

    if base:
        changed = get_changed_plugin_names(base)
    else:
        changed = get_staged_plugin_names()

    if not changed:
        print("No plugin files changed — nothing to check.")
        return

    errors: list[str] = []
    for name in sorted(changed):
        if base:
            bumped = version_changed_vs_base(name, base)
        else:
            bumped = version_changed_staged(name)

        if bumped:
            print(f"  ok    {name}: version bumped")
        else:
            print(f"  FAIL  {name}: files changed but version NOT bumped in marketplace.json")
            errors.append(name)

    if errors:
        print(
            f"\n{len(errors)} plugin(s) need a version bump.\n"
            f"Run: just bump-plugin <name> patch|minor|major",
            file=sys.stderr,
        )
        sys.exit(1)
    else:
        print("\nAll changed plugins have version bumps.")


if __name__ == "__main__":
    main()
