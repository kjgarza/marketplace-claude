#!/usr/bin/env python3
"""Test for gen_codex_agents.py. Run: python3 scripts/tests/test_gen_codex_agents.py"""
import subprocess
import sys
import tempfile
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
GEN = ROOT / "scripts" / "gen_codex_agents.py"

AGENT_MD = """---
name: demo-agent
description: |
  Reviews things. <example>user says X</example> More text.
model: sonnet
codex: true
---

You are a careful reviewer.
Do the review.
"""

NOT_TAGGED = """---
name: skip-me
description: Not for codex.
---

Body.
"""


def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp)
        agents = base / "plugins" / "demo" / "agents"
        agents.mkdir(parents=True)
        (agents / "demo-agent.md").write_text(AGENT_MD)
        (agents / "skip-me.md").write_text(NOT_TAGGED)
        out = base / "adapters" / "codex" / "agents"

        r = subprocess.run(
            [sys.executable, str(GEN), "--root", str(base), "--out", str(out)],
            capture_output=True, text=True,
        )
        assert r.returncode == 0, r.stderr
        files = sorted(p.name for p in out.glob("*.toml"))
        assert files == ["demo-agent.toml"], f"only tagged agents generated, got {files}"

        data = tomllib.loads((out / "demo-agent.toml").read_text())
        assert data["name"] == "demo-agent"
        assert "<example>" not in data["description"], "example blocks must be stripped"
        assert not data["description"].startswith("|"), "block-scalar marker must be stripped"
        assert "careful reviewer" in data["developer_instructions"]
        assert data["model"], "model mapped from Claude tier"

        # freshness check passes right after generation
        r = subprocess.run(
            [sys.executable, str(GEN), "--root", str(base), "--out", str(out), "--check"],
            capture_output=True, text=True,
        )
        assert r.returncode == 0, f"--check should pass after generation: {r.stdout}"

    print("all generator tests passed")


if __name__ == "__main__":
    main()
