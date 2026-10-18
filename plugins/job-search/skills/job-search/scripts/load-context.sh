#!/usr/bin/env bash
# Resolve the user's job-search config and print the candidate context.
#
# Usage:
#   load-context.sh           print config paths, then the profile and target companies
#   load-context.sh --init    scaffold ~/.claude/job-search.local.md + ~/.claude/job-search/ from templates
#
# Config lookup (first hit wins):
#   1. $JOB_SEARCH_CONFIG
#   2. ./.claude/job-search.local.md   (project override)
#   3. ~/.claude/job-search.local.md   (user default; works from any cwd, e.g. launchd)
#
# Frontmatter keys (all required): leads_dir, profile, target_companies.
# Paths may start with ~; relative paths resolve against the config file's directory.
#
# Exit codes: 0 ok, 2 config missing/invalid (message on stderr names the fix).
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATES="$SKILL_DIR/templates"

die() { echo "job-search: $*" >&2; exit 2; }

if [[ "${1:-}" == "--init" ]]; then
  CFG="$HOME/.claude/job-search.local.md"
  DATA="$HOME/.claude/job-search"
  [[ -e "$CFG" ]] && die "$CFG already exists; edit it instead"
  mkdir -p "$DATA"
  for f in profile.md target-companies.md; do
    [[ -e "$DATA/$f" ]] || cp "$TEMPLATES/$f" "$DATA/$f"
  done
  cp "$TEMPLATES/job-search.local.md" "$CFG"
  echo "Created $CFG and $DATA/{profile,target-companies}.md"
  echo "Next: set leads_dir in $CFG and fill in the profile."
  exit 0
fi

CFG=""
for c in "${JOB_SEARCH_CONFIG:-}" "$PWD/.claude/job-search.local.md" "$HOME/.claude/job-search.local.md"; do
  if [[ -n "$c" && -f "$c" ]]; then CFG="$c"; break; fi
done
[[ -n "$CFG" ]] || die "no config found (checked \$JOB_SEARCH_CONFIG, ./.claude/job-search.local.md, ~/.claude/job-search.local.md). Run: bash $SKILL_DIR/scripts/load-context.sh --init"
CFG_DIR="$(cd "$(dirname "$CFG")" && pwd)"

# Read one key from the YAML frontmatter (first --- block). Flat `key: value` only.
get_key() {
  awk -v k="$1" '
    NR == 1 && $0 != "---" { exit }
    NR > 1 && $0 == "---" { exit }
    NR > 1 {
      i = index($0, ":")
      if (i && substr($0, 1, i - 1) == k) {
        v = substr($0, i + 1); sub(/^[ \t]+/, "", v); sub(/[ \t]+$/, "", v)
        gsub(/^["'\'']|["'\'']$/, "", v); print v; exit
      }
    }' "$CFG"
}

resolve() {
  local p="$1"
  [[ "$p" == "~"* ]] && p="$HOME${p:1}"
  [[ "$p" == /* ]] || p="$CFG_DIR/$p"
  echo "$p"
}

for key in leads_dir profile target_companies; do
  val="$(get_key "$key")"
  [[ -n "$val" ]] || die "'$key' missing from frontmatter of $CFG (see $TEMPLATES/job-search.local.md)"
  printf -v "$key" '%s' "$(resolve "$val")"
done

[[ -d "$leads_dir" ]] || die "leads_dir does not exist: $leads_dir (set in $CFG)"
[[ -f "$profile" ]] || die "profile not found: $profile (set in $CFG; template: $TEMPLATES/profile.md)"
[[ -f "$target_companies" ]] || die "target_companies not found: $target_companies (set in $CFG; template: $TEMPLATES/target-companies.md)"

cat <<EOF
<!-- job-search context -->
config: $CFG
leads_dir: $leads_dir
profile: $profile
target_companies: $target_companies

EOF
cat "$profile"
printf '\n\n'
cat "$target_companies"
