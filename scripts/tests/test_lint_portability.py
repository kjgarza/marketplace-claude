#!/usr/bin/env python3
"""Fixture-based test for lint_portability.py. Run: python3 scripts/tests/test_lint_portability.py"""
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
LINT = ROOT / "scripts" / "lint_portability.py"


def make_skill(base: Path, name: str, frontmatter: str, body: str) -> Path:
    d = base / "plugins" / "demo" / "skills" / name
    d.mkdir(parents=True)
    f = d / "SKILL.md"
    f.write_text(f"---\n{frontmatter}\n---\n\n{body}\n")
    return f


def run_lint(base: Path) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(LINT), "--root", str(base)],
        capture_output=True, text=True,
    )


def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp)
        # 1. clean skill -> exit 0
        make_skill(base, "clean", "name: clean\ndescription: x", "Do the thing.")
        r = run_lint(base)
        assert r.returncode == 0, f"clean repo should pass, got:\n{r.stdout}{r.stderr}"

        # 2. CLAUDE_PLUGIN_ROOT in body -> exit 1, path in output
        make_skill(base, "bad-root", "name: bad-root\ndescription: x",
                   "Run ${CLAUDE_PLUGIN_ROOT}/scripts/x.ts")
        r = run_lint(base)
        assert r.returncode == 1, "CLAUDE_PLUGIN_ROOT must be an ERROR"
        assert "bad-root" in r.stdout

    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp)
        # 3. portable: false escape hatch -> exit 0
        make_skill(base, "escaped", "name: escaped\ndescription: x\nportable: false",
                   "Run ${CLAUDE_PLUGIN_ROOT}/scripts/x.ts and mcp__foo__bar")
        r = run_lint(base)
        assert r.returncode == 0, f"portable: false must suppress ERRORs:\n{r.stdout}"

    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp)
        # 4. Claude tool names in body -> ERROR; in frontmatter (allowed-tools) -> ignored
        make_skill(base, "toolname",
                   'name: toolname\ndescription: x\nallowed-tools: ["AskUserQuestion"]',
                   "Use the AskUserQuestion tool here.")
        r = run_lint(base)
        assert r.returncode == 1, "AskUserQuestion in body must be an ERROR"
        assert r.stdout.count("toolname") == 1, "frontmatter mention must not be flagged"

    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp)
        # 5. mcp__ tool id -> ERROR
        make_skill(base, "mcp", "name: mcp\ndescription: x", "Call mcp__sqlite__query now.")
        r = run_lint(base)
        assert r.returncode == 1, "mcp__ must be an ERROR"

    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp)
        # 6. 'Claude Code' prose -> WARN only (exit 0 alone)
        make_skill(base, "prose", "name: prose\ndescription: x",
                   "This works great in Claude Code.")
        r = run_lint(base)
        assert r.returncode == 0, "'Claude Code' prose is WARN, not ERROR"
        assert "WARN" in r.stdout

    print("all lint tests passed")


if __name__ == "__main__":
    main()
