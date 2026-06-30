#!/usr/bin/env bash
# test-pipeline.sh — berlin-events autoresearch metric harness
#
# 1. Iterates sources declared in sources.ts (via list-sources.ts)
# 2. Runs extract-events.ts for each, which dispatches by strategy:
#      readability → fetch + Readability
#      playwright  → chromium + Readability
#      source-extractor → chromium + per-source extract() → Event[] JSON
# 3. Writes extracted output to a temp file and ingests it into qurl
# 4. Embeds and runs qurl vsearch
# 5. Prints:  relevant_results: N
#
# Exit code 0 always; metric is read from stdout by autoresearch loop.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUN=$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")
BUNX=$(command -v bunx 2>/dev/null || echo "$HOME/.bun/bin/bunx")

# Ensure script dependencies (incl. chromium) are installed
if [[ ! -d "$SCRIPT_DIR/node_modules" ]]; then
  echo "Installing script dependencies..."
  (cd "$SCRIPT_DIR" && "$BUN" install --silent && "$BUNX" playwright install chromium >/dev/null 2>&1) \
    || echo "WARN: dependency install reported errors (continuing)"
fi

EMBED_PROVIDER="${QURL_EMBED_PROVIDER:-llama}"
EMBED_MODEL="${QURL_EMBED_MODEL:-hf:ggml-org/embeddinggemma-300M-GGUF/embeddinggemma-300M-Q8_0.gguf}"

# ─── Step 1: Scrape & Ingest ──────────────────────────────────────────────────

echo "=== [1/3] Scraping & ingesting sources ==="
ingest_count=0
fail_count=0

ingest_source() {
  local slug="$1" url="$2" tag="$3"

  printf "  %-22s %-60s " "$slug" "$url"

  tmp_content="$(mktemp "${TMPDIR:-/tmp}/berlin-events-${slug}.XXXXXX")"
  "$BUN" run "$SCRIPT_DIR/extract-events.ts" "$slug" >"$tmp_content" 2>/dev/null || {
    echo "SKIP (extraction failed)"
    rm -f "$tmp_content"
    fail_count=$((fail_count + 1))
    return
  }

  if [[ ! -s "$tmp_content" ]] || [[ "$(tr -d '[:space:]' <"$tmp_content")" == "[]" ]]; then
    echo "SKIP (empty content)"
    rm -f "$tmp_content"
    fail_count=$((fail_count + 1))
    return
  fi

  if qurl add "$url" --file "$tmp_content" --source berlin-events --tags "$tag" 2>/dev/null; then
    echo "OK [$tag]"
    ingest_count=$((ingest_count + 1))
  else
    echo "SKIP (ingest failed)"
    fail_count=$((fail_count + 1))
  fi
  rm -f "$tmp_content"
}

while IFS=$'\t' read -r slug url category _kind; do
  [[ -z "$slug" ]] && continue
  ingest_source "$slug" "$url" "$category"
done < <("$BUN" run "$SCRIPT_DIR/list-sources.ts")

echo ""
echo "  ingested=$ingest_count  failed=$fail_count"

if (( ingest_count < 3 )); then
  echo ""
  echo "ERROR: fewer than 3 sources ingested (AC-1 requires ≥3)"
  echo "relevant_results: 0"
  exit 0
fi

# ─── Step 2: Embed ────────────────────────────────────────────────────────────

echo ""
echo "=== [2/3] Embedding (provider=$EMBED_PROVIDER) ==="
qurl embed --provider "$EMBED_PROVIDER" --model "$EMBED_MODEL" 2>&1 | tail -1

# ─── Step 3: Semantic search ──────────────────────────────────────────────────

echo ""
echo "=== [3/3] Semantic search ==="

QUERY="April 2026 Berlin exhibition opening vernissage workshop event calendar art food"

echo "  query: $QUERY"
echo ""

results=$(
  qurl vsearch "$QUERY" \
    --source berlin-events \
    --limit 20 \
    --provider "$EMBED_PROVIDER" \
    --model "$EMBED_MODEL" \
  2>/dev/null
)

echo "$results"

# ─── Metric ───────────────────────────────────────────────────────────────────

relevant=0
seen_urls=""

current_url=""
while IFS= read -r line; do
  if echo "$line" | grep -qE '^[0-9]+\.[0-9]+ - '; then
    current_url=$(echo "$line" | grep -oE 'https?://[^)]+' | head -1)
  elif [[ -n "$current_url" ]]; then
    if echo "$line" | grep -qiE "(april|may|mai|2026|monday|tuesday|wednesday|thursday|friday|saturday|sunday|vernissage|opening|exhibition|finissage|ausstellung|veranstaltung|fuhrung|führung|kalender|programm)"; then
      if [[ "$seen_urls" != *"$current_url"* ]]; then
        seen_urls="$seen_urls $current_url"
        relevant=$((relevant + 1))
      fi
    fi
    current_url=""
  fi
done <<< "$results"

echo ""
echo "relevant_results: $relevant"
