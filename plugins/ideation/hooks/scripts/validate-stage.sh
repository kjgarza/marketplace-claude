#!/usr/bin/env bash
# PostToolUse(Write) hook — validate ideation stage output files have proper structure.
# Fires only for the pipeline's stage artifacts; everything else passes through.
# On a malformed stage file: exit 2 with guidance so Claude fixes it before the next stage.
set -uo pipefail

INPUT="$(cat)"

/usr/bin/python3 - "$INPUT" <<'PY'
import sys, json, re, os

try:
    data = json.loads(sys.argv[1])
except Exception:
    sys.exit(0)

ti = data.get("tool_input", {}) or {}
path = ti.get("file_path") or ti.get("path") or ""
base = os.path.basename(path).lower()

STAGE_FILES = {
    "problem_space.md", "solutions.md", "reviewed_solutions.md", "ui_concepts.md",
}
if base not in STAGE_FILES:
    sys.exit(0)

content = ti.get("content", "")
if not content:
    try:
        with open(path, encoding="utf-8") as f:
            content = f.read()
    except Exception:
        sys.exit(0)

problems = []

# 1. YAML frontmatter present
m = re.match(r"^---\n(.*?)\n---\n", content, flags=re.S)
if not m:
    problems.append("missing YAML frontmatter (--- ... --- block at top)")
else:
    fm = m.group(1)
    # 2. run_id present in frontmatter
    if not re.search(r"^run_id\s*:\s*\S+", fm, flags=re.M):
        problems.append("frontmatter is missing a non-empty `run_id:` field")

# 3. body not empty
body = re.sub(r"^---\n.*?\n---\n", "", content, flags=re.S).strip()
if len(body) < 20:
    problems.append("body is empty or too short to be a valid stage output")

if problems:
    sys.stderr.write(
        f"ideation: {base} failed stage validation:\n- " + "\n- ".join(problems) +
        f"\nFix {path} before continuing the pipeline (later stages validate this file as a prerequisite).\n"
    )
    sys.exit(2)

sys.exit(0)
PY
