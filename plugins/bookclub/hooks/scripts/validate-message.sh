#!/usr/bin/env bash
# PostToolUse(Write) hook — enforce bookclub Slack message word-count limits deterministically.
# Replaces unreliable LLM self-counting. Only fires for bookclub-{announce,remind,articles,eve}
# message files; everything else passes through untouched.
#
# On violation: exit 2 with an explanation on stderr so Claude trims and rewrites.
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

# Map filename → (min, max) word limits (from bookclub SKILL.md hard limits).
limits = None
if "bookclub-announce" in base or base.startswith("announce"):
    limits = ("announcement", 120, 220)
elif "bookclub-remind" in base or base.startswith("remind"):
    limits = ("reminder", 80, 115)
elif "bookclub-articles" in base or base.startswith("articles"):
    limits = ("articles roundup", 100, 145)
elif "bookclub-eve" in base or base.startswith("eve"):
    limits = ("eve", 120, 175)

if not limits:
    sys.exit(0)  # not a member-facing message file

# Only check Markdown/text bodies, not the Block Kit JSON.
if base.endswith(".json"):
    sys.exit(0)

content = ti.get("content", "")
if not content:
    # content not in tool_input (e.g. Edit) — read from disk if present
    try:
        with open(path, encoding="utf-8") as f:
            content = f.read()
    except Exception:
        sys.exit(0)

# Strip YAML frontmatter and code fences before counting.
body = re.sub(r"^---\n.*?\n---\n", "", content, flags=re.S)
body = re.sub(r"```.*?```", "", body, flags=re.S)
# URLs and :emoji: shortcodes count as one word each (collapse them to single tokens).
body = re.sub(r"https?://\S+", "URL", body)
words = re.findall(r"\S+", body)
n = len(words)

label, lo, hi = limits
if n < lo or n > hi:
    sys.stderr.write(
        f"bookclub: {label} message is {n} words; hard limit is {lo}–{hi}. "
        f"Rewrite the message body in {path} to fall within range "
        f"({'add' if n < lo else 'remove'} words). Count excludes frontmatter and code fences; "
        f"URLs and :emoji: count as one word each.\n"
    )
    sys.exit(2)

sys.exit(0)
PY
