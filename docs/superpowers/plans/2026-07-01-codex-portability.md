# Codex Portability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the marketplace's skills consumable by both Claude Code and OpenAI Codex CLI (agentskills.io standard) by removing Claude-only constructs from portable skills, explicitly tagging non-portable ones, generating Codex agent adapters, and enforcing it all in CI.

**Architecture:** Standard-first. `plugins/<name>/skills/<skill>/SKILL.md` stays the single source of truth (repo layout unchanged). Skills whose resources live inside their own skill directory become spec-portable (skill-relative paths). Skills that depend on plugin-shared scripts/templates or Claude-specific tools (`mcp__*`, `AskUserQuestion`, plugin runtime vars) get `portable: false` frontmatter — a spec-legal extension field — and a `<plugin_dir>` path convention so they still work in Claude. A Python generator emits Codex TOML subagents from Claude agent `.md` files tagged `codex: true`. A grep-based lint fails CI on new portability violations.

**Tech Stack:** Python 3 (stdlib only — matches existing `scripts/*.py`), GitHub Actions (`.github/workflows/validate.yml`), TOML output via string templating (parse-checked with `tomllib`).

**Conventions introduced (used across tasks):**
- `portable: false` — frontmatter field on SKILL.md meaning "Claude-only; excluded from cross-tool vendoring and from lint ERRORs".
- `<skill_dir>` — placeholder in skill bodies meaning "the directory containing this SKILL.md". Defined by a note line in each skill that uses it.
- `<plugin_dir>` — placeholder meaning "the plugin root (two directories above this SKILL.md)". Same mechanism.
- `codex: true` — frontmatter field on agent `.md` files opting them into TOML generation.

---

### Task 1: Portability lint script

**Files:**
- Create: `scripts/lint_portability.py`
- Create: `scripts/tests/test_lint_portability.py`
- Test: `scripts/tests/test_lint_portability.py`

- [ ] **Step 1: Write the failing test**

Create `scripts/tests/test_lint_portability.py`:

```python
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
        # 5. mcp__ tool id -> ERROR; 'Claude Code' prose -> WARN only (exit 0 alone)
        make_skill(base, "mcp", "name: mcp\ndescription: x", "Call mcp__sqlite__query now.")
        r = run_lint(base)
        assert r.returncode == 1, "mcp__ must be an ERROR"
    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp)
        make_skill(base, "prose", "name: prose\ndescription: x",
                   "This works great in Claude Code.")
        r = run_lint(base)
        assert r.returncode == 0, "'Claude Code' prose is WARN, not ERROR"
        assert "WARN" in r.stdout

    print("all lint tests passed")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 scripts/tests/test_lint_portability.py`
Expected: FAIL (traceback — `scripts/lint_portability.py` does not exist yet).

- [ ] **Step 3: Write the lint script**

Create `scripts/lint_portability.py`:

```python
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
    """Return (frontmatter, body, body_start_line). Body line numbers are 1-based."""
    if text.startswith("---"):
        parts = text.split("\n---", 2)
        if len(parts) >= 2:
            fm = parts[0]
            body = parts[1].lstrip("\n") if len(parts) == 2 else ("\n---".join(parts[1:])).lstrip("\n")
            # recompute body offset precisely
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 scripts/tests/test_lint_portability.py`
Expected: `all lint tests passed`

- [ ] **Step 5: Baseline run against the repo**

Run: `python3 scripts/lint_portability.py`
Expected: exit 1 with ~40+ ERROR lines (the known violations in ~30 skills). This is the remediation worklist for Tasks 2–5. Do NOT wire into CI yet.

- [ ] **Step 6: Commit**

```bash
git add scripts/lint_portability.py scripts/tests/test_lint_portability.py
git commit -m "feat: add cross-tool portability lint for SKILL.md files"
```

---

### Task 2: Make self-contained skills spec-portable (skill-relative paths)

These 3 skills reference only resources inside their own skill directory — after this task they vendor standalone into any agentskills.io consumer.

**Files:**
- Modify: `plugins/finanz-pilot/skills/financial-analysis/SKILL.md:118`
- Modify: `plugins/finanz-pilot/skills/hgb-closing-flow/SKILL.md:21-23`
- Modify: `plugins/taskwarrior/skills/task-workflow/SKILL.md:179`

- [ ] **Step 1: financial-analysis — skill-relative reference**

In `plugins/finanz-pilot/skills/financial-analysis/SKILL.md` line 118, replace:

```
`${CLAUDE_PLUGIN_ROOT}/skills/financial-analysis/references/german-financial-system.md`
```

with:

```
`references/german-financial-system.md` (relative to this skill's directory)
```

- [ ] **Step 2: hgb-closing-flow — skill-relative references**

In `plugins/finanz-pilot/skills/hgb-closing-flow/SKILL.md` lines 21–23, replace each `${CLAUDE_PLUGIN_ROOT}/skills/hgb-closing-flow/references/<file>` with `references/<file>`, and add directly above the list (before line 21):

```
Paths below are relative to this skill's directory.
```

- [ ] **Step 3: task-workflow — `<skill_dir>` convention**

In `plugins/taskwarrior/skills/task-workflow/SKILL.md` line 179, replace:

```
bash ${CLAUDE_PLUGIN_ROOT}/skills/task-workflow/scripts/tw-summary.sh
```

with:

```
bash <skill_dir>/scripts/tw-summary.sh
```

and add this line immediately before the code block containing it:

```
`<skill_dir>` = the absolute path of the directory containing this SKILL.md (you saw it when the skill loaded).
```

- [ ] **Step 4: Verify lint no longer flags these 3 files**

Run: `python3 scripts/lint_portability.py | grep -E 'financial-analysis|hgb-closing-flow|task-workflow/SKILL'`
Expected: no ERROR lines for these three paths (task-init still appears — handled in Task 3).

- [ ] **Step 5: Commit**

```bash
git add plugins/finanz-pilot/skills/financial-analysis/SKILL.md plugins/finanz-pilot/skills/hgb-closing-flow/SKILL.md plugins/taskwarrior/skills/task-workflow/SKILL.md
git commit -m "refactor: skill-relative resource paths for self-contained skills"
```

---

### Task 3: `<plugin_dir>` convention + `portable: false` for plugin-coupled skills

These 15 skills reference plugin-level `scripts/`, `templates/`, or other skills' resources. They cannot vendor standalone, so they are tagged Claude-only; the `${CLAUDE_PLUGIN_ROOT}` var is still replaced so the body reads tool-neutrally.

**Files (all Modify):**
- `plugins/finanz-pilot/skills/bilanz-guv-format/SKILL.md`
- `plugins/finanz-pilot/skills/capital-allocation/SKILL.md`
- `plugins/finanz-pilot/skills/evaluate-pension/SKILL.md`
- `plugins/finanz-pilot/skills/real-estate-readiness/SKILL.md`
- `plugins/finanz-pilot/skills/retirement-readiness/SKILL.md`
- `plugins/finanz-pilot/skills/skr04-kontenrahmen/SKILL.md`
- `plugins/finanz-pilot/skills/tax-check/SKILL.md`
- `plugins/readitlater-digest/skills/digest/SKILL.md`
- `plugins/readitlater-digest/skills/feedback/SKILL.md`
- `plugins/readitlater-digest/skills/status/SKILL.md`
- `plugins/vhs-berlin-agent/skills/vhs-digest/SKILL.md`
- `plugins/vhs-berlin-agent/skills/vhs-search/SKILL.md`
- `plugins/vhs-berlin-agent/skills/vhs-watch/SKILL.md`
- `plugins/berlin-events/skills/event-sources/SKILL.md`
- `plugins/taskwarrior/skills/task-init/SKILL.md`

- [ ] **Step 1: Replace the variable in all 15 files**

Run (from repo root):

```bash
for f in plugins/finanz-pilot/skills/{bilanz-guv-format,capital-allocation,evaluate-pension,real-estate-readiness,retirement-readiness,skr04-kontenrahmen,tax-check}/SKILL.md \
         plugins/readitlater-digest/skills/{digest,feedback,status}/SKILL.md \
         plugins/vhs-berlin-agent/skills/{vhs-digest,vhs-search,vhs-watch}/SKILL.md \
         plugins/berlin-events/skills/event-sources/SKILL.md \
         plugins/taskwarrior/skills/task-init/SKILL.md; do
  sed -i '' -e 's|\${CLAUDE_PLUGIN_ROOT}|<plugin_dir>|g' -e 's|\$CLAUDE_PLUGIN_ROOT|<plugin_dir>|g' "$f"
done
```

- [ ] **Step 2: Add `portable: false` to frontmatter of the same 15 files**

For each file, insert the line `portable: false` immediately before the closing `---` of the YAML frontmatter. Use:

```bash
for f in <same list as step 1>; do
  awk 'BEGIN{c=0} /^---$/{c++; if(c==2){print "portable: false"}} {print}' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
done
```

Verify one file by eye (`head -8 plugins/readitlater-digest/skills/digest/SKILL.md`) — frontmatter must remain valid YAML with `name`, `description`, `portable: false`.

- [ ] **Step 3: Add the `<plugin_dir>` definition line to each of the 15 files**

Insert as the first body line after the frontmatter (same `awk` position trick, after the closing `---`):

```
> `<plugin_dir>` = this plugin's root directory (two levels above this SKILL.md).
```

- [ ] **Step 4: Tag `find-events` (has `${CLAUDE_PLUGIN_ROOT:-...}` fallback and MCP deps)**

`plugins/berlin-events/skills/find-events/SKILL.md` lines 49/135/160 use `PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-plugins/berlin-events}"` — a working fallback; leave the shell lines as-is. Just add `portable: false` to its frontmatter (same awk insert as Step 2).

- [ ] **Step 5: Validate and lint**

Run: `python3 scripts/validate.py`
Expected: passes (frontmatter still valid).
Run: `python3 scripts/lint_portability.py | grep CLAUDE_PLUGIN_ROOT`
Expected: no output (all occurrences gone or exempted).

- [ ] **Step 6: Commit**

```bash
git add plugins/finanz-pilot plugins/readitlater-digest plugins/vhs-berlin-agent plugins/berlin-events plugins/taskwarrior
git commit -m "refactor: plugin_dir convention + portable:false tags for plugin-coupled skills"
```

---

### Task 4: Tag MCP-dependent skills `portable: false`

**Files (all Modify — frontmatter only):**
- `plugins/bulletjournal/skills/daily-migrate/SKILL.md`
- `plugins/bulletjournal/skills/inbox-triage/SKILL.md`
- `plugins/bulletjournal/skills/monthly-review/SKILL.md`
- `plugins/bulletjournal/skills/sync-daily/SKILL.md`
- `plugins/bulletjournal/skills/weekly-review/SKILL.md`
- `plugins/kjgarza-base/skills/find-linkedin-contacts/SKILL.md`
- `plugins/taskwarrior/skills/task-calendar/SKILL.md`

(`vhs-*` and `find-events` were already tagged in Task 3.)

- [ ] **Step 1: Insert `portable: false` into the 7 frontmatters**

Same `awk` insert as Task 3 Step 2, applied to the 7 files above. Skip any file that already contains a `portable:` line (idempotence check: `grep -L '^portable:' <files>` first and only process those).

- [ ] **Step 2: Lint must be clean of mcp__ errors**

Run: `python3 scripts/lint_portability.py | grep -c ERROR`
Expected: only the AskUserQuestion/TodoWrite errors from the 4 files handled in Task 5 remain (≤ ~9 ERROR lines, all in project-scaffold, planning-with-files, generate-infra, generate-ui).

- [ ] **Step 3: Commit**

```bash
git add plugins/bulletjournal plugins/kjgarza-base plugins/taskwarrior
git commit -m "chore: tag MCP-dependent skills portable:false"
```

---

### Task 5: Capability phrasing for Claude tool names

These 4 skills are otherwise portable; rephrase tool names as capabilities. Frontmatter `allowed-tools` entries stay (ignored by other tools; lint only scans body).

**Files:**
- Modify: `plugins/kjgarza-base/skills/project-scaffold/SKILL.md:17`
- Modify: `plugins/kjgarza-product/skills/planning-with-files/SKILL.md:145`
- Modify: `plugins/prototyping-skills/skills/generate-infra/SKILL.md:53-54,134`
- Modify: `plugins/prototyping-skills/skills/generate-ui/SKILL.md:41,64`

- [ ] **Step 1: project-scaffold**

Line 17, replace:

```
Follow these steps in order. Use the AskUserQuestion tool for each step.
```

with:

```
Follow these steps in order. At each step, ask the user a structured multiple-choice question (use a native question tool if available, otherwise plain text options a/b/c).
```

- [ ] **Step 2: planning-with-files**

Line 145 is a comparison-table row. Replace the cell text `Use TodoWrite for persistence` with `Rely on the session todo list for persistence` (keep the table structure and the other cell unchanged).

- [ ] **Step 3: generate-infra**

Lines 53, 54, and 134: replace each `` use `AskUserQuestion` `` / `` Ask a follow-up with `AskUserQuestion` `` phrasing with `ask the user (multiple-choice)` / `Ask the user a follow-up (multiple-choice)`, keeping the quoted question text unchanged. Read each full line first; preserve list numbering and bold markers.

- [ ] **Step 4: generate-ui**

Lines 41 and 64: same substitution — `` use `AskUserQuestion` to ask: `` → `ask the user (multiple-choice):`; `` Gate this section with `AskUserQuestion` `` → `Gate this section by asking the user (multiple-choice)`.

- [ ] **Step 5: Lint must now pass repo-wide**

Run: `python3 scripts/lint_portability.py`
Expected: exit 0, `0 error(s)` (WARNs allowed).

- [ ] **Step 6: Commit**

```bash
git add plugins/kjgarza-base plugins/kjgarza-product plugins/prototyping-skills
git commit -m "refactor: phrase Claude tool references as capabilities in portable skills"
```

---

### Task 6: Codex agent TOML generator

**Files:**
- Create: `scripts/gen_codex_agents.py`
- Create: `scripts/tests/test_gen_codex_agents.py`
- Modify: `plugins/kjgarza-product/agents/product-manager.md` (frontmatter: add `codex: true`)
- Modify: `plugins/kjgarza-product/agents/senior-dev-advisor.md` (frontmatter: add `codex: true`)
- Modify: `plugins/scholarly-comms-researcher/agents/scholarly-comms-researcher.md` (frontmatter: add `codex: true`)
- Create (generated): `adapters/codex/agents/*.toml`

- [ ] **Step 1: Write the failing test**

Create `scripts/tests/test_gen_codex_agents.py`:

```python
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
description: Reviews things. <example>user says X</example> More text.
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
        assert "careful reviewer" in data["developer_instructions"]
        assert data["model"], "model mapped from Claude tier"

    print("all generator tests passed")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 scripts/tests/test_gen_codex_agents.py`
Expected: FAIL (`gen_codex_agents.py` missing).

- [ ] **Step 3: Write the generator**

Create `scripts/gen_codex_agents.py`:

```python
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
    if fm.get("codex", "").lower() != "true":
        return None
    desc = re.sub(r"<example>.*?</example>", "", fm.get("description", ""), flags=re.DOTALL)
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 scripts/tests/test_gen_codex_agents.py`
Expected: `all generator tests passed`

- [ ] **Step 5: Tag the 3 agents and generate**

Add `codex: true` as a new frontmatter line (before the closing `---`) in:
- `plugins/kjgarza-product/agents/product-manager.md`
- `plugins/kjgarza-product/agents/senior-dev-advisor.md`
- `plugins/scholarly-comms-researcher/agents/scholarly-comms-researcher.md`

Then run: `python3 scripts/gen_codex_agents.py`
Expected: `wrote adapters/codex/agents/<name>.toml` × 3.

Verify each parses: write `scripts/tests/check_toml.py` is unnecessary — reuse: `python3 scripts/gen_codex_agents.py --check` → `adapters up to date`.

- [ ] **Step 6: Commit**

```bash
git add scripts/gen_codex_agents.py scripts/tests/test_gen_codex_agents.py adapters/ plugins/kjgarza-product/agents plugins/scholarly-comms-researcher/agents
git commit -m "feat: generate Codex subagent TOML adapters from tagged Claude agents"
```

---

### Task 7: Wire lint + adapter freshness into CI

**Files:**
- Modify: `.github/workflows/validate.yml`

- [ ] **Step 1: Add two steps to the validate job**

Append to the `steps:` list in `.github/workflows/validate.yml` (after "Validate marketplace and skills"):

```yaml
      - name: Portability lint
        run: python3 scripts/lint_portability.py

      - name: Codex adapters up to date
        run: python3 scripts/gen_codex_agents.py --check
```

- [ ] **Step 2: Verify locally (CI parity)**

Run: `python3 scripts/validate.py && python3 scripts/lint_portability.py && python3 scripts/gen_codex_agents.py --check`
Expected: all three exit 0.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/validate.yml
git commit -m "ci: enforce portability lint and codex adapter freshness"
```

---

### Task 8: Documentation

**Files:**
- Create: `docs/CODEX.md`
- Modify: `CLAUDE.md` (one pointer line in Rules section)
- Modify: `README.md` (one consumption section)

- [ ] **Step 1: Write `docs/CODEX.md`**

```markdown
# Using this marketplace outside Claude Code

Skills in this repo follow the [Agent Skills standard](https://agentskills.io) and are
consumable by OpenAI Codex CLI, Cursor, Gemini CLI, and other adopters.

## Install skills into a project (both Claude Code and Codex)

    npx skills add kjgarza/marketplace-claude --skill <skill-name>

This vendors the skill into `<repo>/.agents/skills/` (read natively by Codex),
symlinks it into `.claude/skills/` (read natively by Claude Code), and records it in
`skills-lock.json`. Commit all three. Update later with `npx skills update`.

For Claude-only extras (agents, hooks, output-styles), additionally enable the plugin in
`.claude/settings.json` → `"enabledPlugins": ["<plugin>@marketplace-claude"]`.

## Portability conventions

- Skills without a `portable:` field are cross-tool portable: resources referenced
  relative to the skill directory, no Claude-specific tool names in the body.
- `portable: false` in SKILL.md frontmatter = Claude-only (depends on plugin-shared
  scripts, MCP servers, or Claude tools). Do not vendor these elsewhere.
- `<skill_dir>` / `<plugin_dir>` placeholders in skill bodies mean the directory
  containing the SKILL.md / the plugin root, respectively.
- Enforced by `scripts/lint_portability.py` (runs in CI).

## Codex subagents

Claude agent `.md` files tagged `codex: true` in frontmatter are converted to Codex
TOML by `scripts/gen_codex_agents.py` into `adapters/codex/agents/`. Install one with:

    mkdir -p .codex/agents
    cp <marketplace>/adapters/codex/agents/<name>.toml .codex/agents/

Commands, hooks, and output-styles are not ported: command content belongs in skills
(Codex triggers skills via `$skill-name`), the single hook stays Claude-only, and
output-style personas can be pasted into a project's AGENTS.md.
```

- [ ] **Step 2: Pointer lines**

In `CLAUDE.md`, add to the `## Rules` section:

```markdown
Cross-tool (Codex/agentskills.io) portability conventions live in `docs/CODEX.md`. New skills must pass `python3 scripts/lint_portability.py`.
```

In `README.md`, add a short section `## Using with Codex CLI / other agents` containing the `npx skills add kjgarza/marketplace-claude --skill <name>` one-liner and a link to `docs/CODEX.md`.

- [ ] **Step 3: Commit**

```bash
git add docs/CODEX.md CLAUDE.md README.md
git commit -m "docs: cross-tool consumption guide and portability conventions"
```

---

### Task 9: Version bumps + final validation

CI (`check-version-bumped.py --base`) requires a version bump for every plugin with changed files. Touched plugins: `finanz-pilot`, `taskwarrior`, `readitlater-digest`, `vhs-berlin-agent`, `berlin-events`, `bulletjournal`, `kjgarza-base`, `kjgarza-product`, `prototyping-skills`, `scholarly-comms-researcher`.

**Files:**
- Modify: `.claude-plugin/marketplace.json` (+ each plugin's `.claude-plugin/plugin.json` if the bump tool updates both)

- [ ] **Step 1: Bump patch version of each touched plugin**

```bash
for p in finanz-pilot taskwarrior readitlater-digest vhs-berlin-agent berlin-events bulletjournal kjgarza-base kjgarza-product prototyping-skills scholarly-comms-researcher; do
  python3 scripts/bump-version.py plugin "$p" patch
done
```

(Syntax per the tool itself: `bump-version.py plugin <name> <patch|minor|major>`; it updates `marketplace.json` and the plugin's `plugin.json` if present.)

- [ ] **Step 2: Full local CI parity check**

```bash
python3 scripts/validate.py
python3 scripts/lint_portability.py
python3 scripts/gen_codex_agents.py --check
python3 scripts/check-version-bumped.py --base origin/main
python3 scripts/tests/test_lint_portability.py
python3 scripts/tests/test_gen_codex_agents.py
```

Expected: all exit 0.

- [ ] **Step 3: Commit**

```bash
git add .claude-plugin/marketplace.json plugins/*/.claude-plugin/plugin.json plugins/*/plugin.json 2>/dev/null || true
git commit -m "chore: bump versions for portability-touched plugins"
```

---

## Out of scope (deliberate)

- Rewriting `mcp__*`-dependent skill bodies as capability+CLI-fallback (bulletjournal, vhs) — tagged `portable: false` instead; rewrite plugin-by-plugin when actually needed in Codex.
- Converting the 37 commands to Codex prompts — content folds into skills on demand.
- Porting the prototyping-skills hook — stays Claude-only.
- Per-project rollout (`npx skills add` in consuming repos) — happens as repos are touched.
- `ticket-swarm` (uncommitted, lives outside this worktree).
