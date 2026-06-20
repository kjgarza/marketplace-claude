#!/usr/bin/env bash
# Validate plugin structure against plugin-development.md rules.
# Usage: bash scripts/validate-plugin.sh <plugin-name>
#        bash scripts/validate-plugin.sh --all

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGINS_DIR="$REPO_ROOT/plugins"
MARKETPLACE="$REPO_ROOT/.claude-plugin/marketplace.json"
PASS=0
FAIL=0

red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
warn()  { printf '\033[33m%s\033[0m\n' "$*"; }

check() {
  local label="$1"
  local result="$2"
  local detail="${3:-}"
  if [ "$result" = "ok" ]; then
    green "  [PASS] $label"
    PASS=$((PASS + 1))
  else
    red "  [FAIL] $label"
    [ -n "$detail" ] && printf '         %s\n' "$detail"
    FAIL=$((FAIL + 1))
  fi
}

validate_plugin() {
  local name="$1"
  local dir="$PLUGINS_DIR/$name"

  if [ ! -d "$dir" ]; then
    red "Plugin directory not found: $dir"
    FAIL=$((FAIL + 1))
    return
  fi

  printf '\n=== %s ===\n' "$name"

  # 1. .claude-plugin/plugin.json exists and is valid JSON
  local manifest="$dir/.claude-plugin/plugin.json"
  if [ -f "$manifest" ]; then
    if python3 -m json.tool "$manifest" > /dev/null 2>&1; then
      check ".claude-plugin/plugin.json valid JSON" "ok"
    else
      check ".claude-plugin/plugin.json valid JSON" "fail" "Invalid JSON in $manifest"
    fi
  else
    check ".claude-plugin/plugin.json exists" "fail" "Missing: $manifest"
  fi

  # 2. All SKILL.md files have name and description frontmatter
  local skills_dir="$dir/skills"
  if [ -d "$skills_dir" ]; then
    local skill_count=0
    local skill_fail=0
    while IFS= read -r -d '' skill_file; do
      skill_count=$((skill_count + 1))
      local has_name has_desc
      has_name=$(grep -c '^name:' "$skill_file" 2>/dev/null || true)
      has_desc=$(grep -c '^description:' "$skill_file" 2>/dev/null || true)
      if [ "$has_name" -eq 0 ] || [ "$has_desc" -eq 0 ]; then
        skill_fail=$((skill_fail + 1))
        red "  [FAIL] SKILL.md missing frontmatter: ${skill_file#"$REPO_ROOT/"}"
        FAIL=$((FAIL + 1))
      fi
    done < <(find "$skills_dir" -name "SKILL.md" -print0)

    if [ "$skill_count" -gt 0 ] && [ "$skill_fail" -eq 0 ]; then
      check "All $skill_count SKILL.md have name+description" "ok"
    elif [ "$skill_count" -eq 0 ]; then
      warn "  [SKIP] No skills found"
    fi

    # 3. Skill description trigger phrase
    local trigger_fail=0
    while IFS= read -r -d '' skill_file; do
      local desc_line
      desc_line=$(grep '^description:' "$skill_file" 2>/dev/null | head -1 || true)
      if [ -n "$desc_line" ]; then
        if ! echo "$desc_line" | grep -qi 'this skill should be used when'; then
          trigger_fail=$((trigger_fail + 1))
          warn "  [WARN] description missing trigger phrase: ${skill_file#"$REPO_ROOT/"}"
        fi
      fi
    done < <(find "$skills_dir" -name "SKILL.md" -print0)

    if [ "$skill_count" -gt 0 ] && [ "$trigger_fail" -eq 0 ]; then
      check "All skill descriptions use trigger phrase" "ok"
    elif [ "$trigger_fail" -gt 0 ]; then
      FAIL=$((FAIL + trigger_fail))
    fi
  fi

  # 4. Hook scripts referenced in hooks/hooks.json exist
  local hooks_json="$dir/hooks/hooks.json"
  if [ -f "$hooks_json" ]; then
    local missing_scripts=0
    while IFS= read -r script_path; do
      # Extract bash script paths from hook command fields
      script_path="${script_path/\$\{CLAUDE_PLUGIN_ROOT\}/$dir}"
      # Grab the actual path after 'bash '
      actual_path=$(echo "$script_path" | grep -oE '[^ ]+\.sh' | head -1 || true)
      if [ -n "$actual_path" ] && [ ! -f "$actual_path" ]; then
        missing_scripts=$((missing_scripts + 1))
        red "  [FAIL] Hook script missing: $actual_path"
        FAIL=$((FAIL + 1))
      fi
    done < <(python3 -c "
import json, sys
data = json.load(open('$hooks_json'))
hooks_block = data.get('hooks', data)
for event_hooks in hooks_block.values():
    for entry in (event_hooks if isinstance(event_hooks, list) else []):
        for h in entry.get('hooks', []):
            if h.get('type') == 'command':
                print(h.get('command', ''))
" 2>/dev/null || true)
    if [ "$missing_scripts" -eq 0 ]; then
      check "Hook scripts exist" "ok"
    fi
  fi

  # 5. marketplace.json has entry for this plugin
  if [ -f "$MARKETPLACE" ]; then
    local in_marketplace
    in_marketplace=$(python3 -c "
import json
data = json.load(open('$MARKETPLACE'))
plugins = data.get('plugins', [])
names = [p.get('name','') for p in plugins]
print('yes' if '$name' in names else 'no')
" 2>/dev/null || echo "no")
    if [ "$in_marketplace" = "yes" ]; then
      check "marketplace.json has entry" "ok"
      # Also verify source path resolves
      local source_path
      source_path=$(python3 -c "
import json
data = json.load(open('$MARKETPLACE'))
for p in data.get('plugins', []):
    if p.get('name') == '$name':
        print(p.get('source', ''))
        break
" 2>/dev/null || true)
      if [ -n "$source_path" ]; then
        local resolved="$REPO_ROOT/${source_path#./}"
        if [ -d "$resolved" ]; then
          check "marketplace.json source path resolves" "ok"
        else
          check "marketplace.json source path resolves" "fail" "Path not found: $resolved"
        fi
      fi
    else
      check "marketplace.json has entry" "fail" "No entry for '$name' in marketplace.json"
    fi
  fi
}

main() {
  if [ $# -eq 0 ]; then
    printf 'Usage: bash scripts/validate-plugin.sh <plugin-name>\n'
    printf '       bash scripts/validate-plugin.sh --all\n'
    exit 1
  fi

  if [ "$1" = "--all" ]; then
    for plugin_dir in "$PLUGINS_DIR"/*/; do
      validate_plugin "$(basename "$plugin_dir")"
    done
  else
    validate_plugin "$1"
  fi

  printf '\n'
  printf '%d passed, %d failed\n' "$PASS" "$FAIL"
  [ "$FAIL" -eq 0 ]
}

main "$@"
