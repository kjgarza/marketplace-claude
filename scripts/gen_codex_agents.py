#!/usr/bin/env python3
"""Generate Codex CLI subagent TOML files from Claude agent .md files tagged `codex: true`.

Mapping: name -> name; description (minus <example> blocks) -> description;
body -> developer_instructions; model tier -> Codex model via MODEL_MAP.
Claude `tools:` restrictions have no TOML equivalent and are dropped.

Usage: python3 scripts/gen_codex_agents.py [--root DIR] [--out DIR] [--check]
  --check: exit 1 if generated output differs from what is on disk (CI freshness).
"""
import argparse
import re
import sys
from pathlib import Path

MODEL_MAP = {
    "haiku": "gpt-5.3-codex-mini",
    "sonnet": "gpt-5.3-codex",
    "opus": "gpt-5.3-codex",
}
DEFAULT_MODEL = "gpt-5.3-codex"


def parse_agent(text: str) -> dict | None:
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.DOTALL)
    if not m:
        return None
    fm_text, body = m.group(1), m.group(2).strip()
    fm: dict[str, str] = {}
    key = None
    for line in fm_text.splitlines():
        km = re.match(r"^(\w[\w-]*):\s*(.*)$", line)
        if km:
            key = km.group(1)
            fm[key] = km.group(2).strip()
        elif key and line.startswith((" ", "\t")):
            fm[key] += " " + line.strip()
    # strip YAML block-scalar markers (description: | / >-)
    fm = {k: re.sub(r"^[|>]-?\s*", "", v) for k, v in fm.items()}
    if fm.get("codex", "").lower() != "true":
        return None
    desc = re.sub(r"<example>.*?</example>", "", fm.get("description", ""), flags=re.DOTALL)
    desc = re.sub(r"\bExamples?\b[^.]*:\s*$", "", desc.strip())
    desc = re.sub(r"\s+", " ", desc).strip()
    return {
        "name": fm.get("name", ""),
        "description": desc,
        "model": MODEL_MAP.get(fm.get("model", ""), DEFAULT_MODEL),
        "developer_instructions": body,
    }


def toml_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


def render(agent: dict) -> str:
    body = agent["developer_instructions"].replace('"""', '\\"\\"\\"')
    return (
        f'name = "{toml_escape(agent["name"])}"\n'
        f'description = "{toml_escape(agent["description"])}"\n'
        f'model = "{agent["model"]}"\n'
        f'developer_instructions = """\n{body}\n"""\n'
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".")
    ap.add_argument("--out", default=None)
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    root = Path(args.root)
    out = Path(args.out) if args.out else root / "adapters" / "codex" / "agents"

    generated: dict[Path, str] = {}
    for md in sorted(root.glob("plugins/*/agents/*.md")):
        agent = parse_agent(md.read_text(encoding="utf-8"))
        if not agent:
            continue
        name = agent["name"] or md.stem
        agent["name"] = name
        generated[out / f"{name}.toml"] = render(agent)

    if args.check:
        stale = [str(p) for p, content in generated.items()
                 if not p.exists() or p.read_text() != content]
        extra = [str(p) for p in out.glob("*.toml") if p not in generated] if out.exists() else []
        if stale or extra:
            print(f"stale/missing: {stale}\nunexpected: {extra}")
            return 1
        print("adapters up to date")
        return 0

    out.mkdir(parents=True, exist_ok=True)
    for path, content in generated.items():
        path.write_text(content, encoding="utf-8")
        print(f"wrote {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
