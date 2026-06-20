#!/usr/bin/env python3
"""Validate marketplace.json and all plugin SKILL.md files."""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
MARKETPLACE = ROOT / ".claude-plugin" / "marketplace.json"

errors: list[str] = []


def err(msg: str) -> None:
    errors.append(msg)
    print(f"  FAIL  {msg}", file=sys.stderr)


def ok(msg: str) -> None:
    print(f"  ok    {msg}")


def validate_marketplace() -> dict:
    print("── marketplace.json")
    try:
        data = json.loads(MARKETPLACE.read_text())
    except Exception as e:
        err(f"invalid JSON: {e}")
        return {}

    version = data.get("metadata", {}).get("version", "")
    if re.match(r"^\d+\.\d+\.\d+$", version):
        ok(f"version {version}")
    else:
        err(f"bad metadata.version: '{version}'")

    root_resolved = ROOT.resolve()
    for p in data.get("plugins", []):
        name = p.get("name", "?")
        pver = p.get("version", "")
        source = p.get("source", "")
        version_ok = bool(re.match(r"^\d+\.\d+\.\d+$", pver))
        if not version_ok:
            err(f"plugin {name}: bad version '{pver}'")
        if not source:
            err(f"plugin {name}: missing source path")
            continue
        path = (ROOT / source).resolve()
        try:
            path.relative_to(root_resolved)
        except ValueError:
            err(f"plugin {name}: source path escapes repo: {source}")
            continue
        if not path.exists():
            err(f"plugin {name}: source path missing: {source}")
        elif version_ok:
            ok(f"plugin {name} {pver}")

    return data


def validate_skill_frontmatter(skill_path: Path) -> None:
    text = skill_path.read_text()
    if not text.startswith("---"):
        err(f"{skill_path.relative_to(ROOT)}: missing YAML frontmatter")
        return
    end = text.find("---", 3)
    if end == -1:
        err(f"{skill_path.relative_to(ROOT)}: unclosed frontmatter")
        return
    fm = text[3:end]
    has_name = re.search(r"^name\s*:", fm, re.MULTILINE)
    has_desc = re.search(r"^description\s*:", fm, re.MULTILINE)
    if not has_name:
        err(f"{skill_path.relative_to(ROOT)}: frontmatter missing 'name'")
    if not has_desc:
        err(f"{skill_path.relative_to(ROOT)}: frontmatter missing 'description'")
    if has_name and has_desc:
        ok(str(skill_path.relative_to(ROOT)))


def validate_skills() -> None:
    print("── SKILL.md files")
    skills = list(ROOT.glob("plugins/*/skills/*/SKILL.md"))
    if not skills:
        ok("no SKILL.md files found")
        return
    for s in sorted(skills):
        validate_skill_frontmatter(s)


def validate_plugin_jsons() -> None:
    print("── plugin.json files")
    paths = set(ROOT.glob("plugins/*/.claude-plugin/plugin.json"))
    paths.update(ROOT.glob("plugins/*/plugin.json"))
    if not paths:
        ok("no plugin.json files found")
        return

    for pjson in sorted(paths):
        try:
            data = json.loads(pjson.read_text())
        except Exception as e:
            err(f"{pjson.relative_to(ROOT)}: invalid JSON: {e}")
            continue
        ver = data.get("version", "")
        if re.match(r"^\d+\.\d+\.\d+$", ver):
            ok(f"{pjson.relative_to(ROOT)} v{ver}")
        else:
            err(f"{pjson.relative_to(ROOT)}: bad version '{ver}'")


if __name__ == "__main__":
    validate_marketplace()
    validate_skills()
    validate_plugin_jsons()

    if errors:
        print(f"\n{len(errors)} error(s) found", file=sys.stderr)
        sys.exit(1)
    else:
        print("\nAll checks passed")
