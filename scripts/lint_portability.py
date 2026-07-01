#!/usr/bin/env python3
"""Lint SKILL.md files for Claude-only constructs that break cross-tool portability.

ERROR (exit 1) unless the skill's frontmatter has `portable: false`:
  - ${CLAUDE_PLUGIN_ROOT} / $CLAUDE_PLUGIN_ROOT in body
  - mcp__<server>__<tool> tool ids in body
  - Claude tool names in body: AskUserQuestion, TodoWrite, ExitPlanMode
  - Claude orchestration API: subagent_type, "Task tool"

WARN (informational, exit 0 on its own):
  - "Claude Code" in body (tool-name coupling in prose)
  - ../.. relative paths (escape the skill directory; break vendoring)

Usage: python3 scripts/lint_portability.py [--root DIR]
"""
import argparse
import re
import sys
from pathlib import Path

ERROR_PATTERNS = [
    (re.compile(r"\$\{?CLAUDE_PLUGIN_ROOT\}?"), "CLAUDE_PLUGIN_ROOT (use <skill_dir>/<plugin_dir> convention)"),
    (re.compile(r"\bmcp__\w+__\w+"), "hardcoded MCP tool id (describe capability + CLI fallback)"),
    (re.compile(r"\b(AskUserQuestion|TodoWrite|ExitPlanMode)\b"), "Claude tool name in body (phrase as capability)"),
    (re.compile(r"\bsubagent_type\b|\bTask tool\b"), "Claude orchestration API"),
]
WARN_PATTERNS = [
    (re.compile(r"\bClaude Code\b"), "tool-name coupling in prose"),
    (re.compile(r"\.\./\.\."), "path escapes skill directory (breaks vendoring)"),
]


def split_frontmatter(text: str) -> tuple[str, str, int]:
    """Return (frontmatter, body, body_start_line). Line numbers are 1-based."""
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            fm = text[3:end]
            body = text[end + 4:]
            return fm, body, text[: end + 4].count("\n") + 1
    return "", text, 1


def is_portable_false(frontmatter: str) -> bool:
    return re.search(r"^portable:\s*false\s*$", frontmatter, re.MULTILINE) is not None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".", help="repo root to scan")
    args = ap.parse_args()
    root = Path(args.root)

    errors = 0
    warns = 0
    for skill in sorted(root.glob("plugins/*/skills/*/SKILL.md")):
        text = skill.read_text(encoding="utf-8")
        fm, body, offset = split_frontmatter(text)
        exempt = is_portable_false(fm)
        rel = skill.relative_to(root)
        for lineno, line in enumerate(body.splitlines(), start=offset):
            for pat, msg in ERROR_PATTERNS:
                if pat.search(line) and not exempt:
                    print(f"ERROR {rel}:{lineno}: {msg}")
                    errors += 1
            for pat, msg in WARN_PATTERNS:
                if pat.search(line):
                    print(f"WARN  {rel}:{lineno}: {msg}")
                    warns += 1

    print(f"lint_portability: {errors} error(s), {warns} warning(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
