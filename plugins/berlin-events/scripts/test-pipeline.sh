#!/usr/bin/env bash
# test-pipeline.sh — berlin-events autoresearch metric harness
#
# 1. Scrapes priority event sources via extract-content.js
# 2. Ingests content into qurl under source=berlin-events
# 3. Runs qurl embed to generate vectors
# 4. Runs qurl vsearch with preferences from berlin-events.local.md
# 5. Prints:  relevant_results: N
#
# Exit code 0 always; metric is read from stdout by autoresearch loop.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Ensure script dependencies are installed
if [[ ! -d "$SCRIPT_DIR/node_modules" ]]; then
  echo "Installing script dependencies..."
  cd "$SCRIPT_DIR" && bun install --silent
  cd - >/dev/null
fi

# qurl embed model (defaults match qmd's cache so model is likely already downloaded)
EMBED_PROVIDER="${QURL_EMBED_PROVIDER:-llama}"
EMBED_MODEL="${QURL_EMBED_MODEL:-hf:ggml-org/embeddinggemma-300M-GGUF/embeddinggemma-300M-Q8_0.gguf}"

# ─── Sources ──────────────────────────────────────────────────────────────────

# Sources: "url|tags" pairs
SOURCES=(
  "https://www.berlinartlink.com/|art"
  "https://www.artatberlin.com/en/calendar-for-vernissagen-exhibitions-events/|art"
  "https://www.indexberlin.com/events/list/|art"
  "https://www.berlin.de/en/events/|food"
  "https://mitvergnuegen.com/category/ausgehen/events|food"
)

# ─── Step 1: Scrape & Ingest ──────────────────────────────────────────────────

echo "=== [1/3] Scraping & ingesting sources ==="
ingest_count=0
fail_count=0

ingest_url() {
  local url="$1"
  local tag="$2"

  printf "  %-60s " "$url"

  content=$(bun run "$SCRIPT_DIR/extract-content.js" "$url" 2>/dev/null) || {
    echo "SKIP (extraction failed)"
    fail_count=$((fail_count + 1))
    return
  }

  if [[ -z "${content// /}" ]]; then
    echo "SKIP (empty content)"
    fail_count=$((fail_count + 1))
    return
  fi

  echo "$content" | qurl add "$url" --source berlin-events --tags "$tag" 2>/dev/null && {
    echo "OK [$tag]"
    ingest_count=$((ingest_count + 1))
  } || {
    echo "SKIP (ingest failed)"
    fail_count=$((fail_count + 1))
  }
}

for entry in "${SOURCES[@]}"; do
  url="${entry%%|*}"
  tag="${entry##*|}"
  ingest_url "$url" "$tag"
done

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

# Query built from berlin-events.local.md preferences:
#   interests: art, food
#   neighborhood: Schöneberg
#   notes: free events, photography exhibitions, Japanese/Mexican food, Francis Bacon style
QUERY="art food events Berlin Schöneberg photography exhibitions Japanese Mexican Francis Bacon free"

echo "  query: $QUERY"
echo ""

results=$(
  qurl vsearch "$QUERY" \
    --source berlin-events \
    --limit 10 \
    --provider "$EMBED_PROVIDER" \
    --model "$EMBED_MODEL" \
  2>/dev/null
)

echo "$results"

# ─── Metric ───────────────────────────────────────────────────────────────────
# Count unique document URLs in results whose snippet contains event date keywords.
# This avoids inflating the count with duplicate chunks from the same document.

relevant=0
seen_urls=""

current_url=""
while IFS= read -r line; do
  # Score line: "0.692 - Title (https://...)" — extract URL via grep
  if echo "$line" | grep -qE '^[0-9]+\.[0-9]+ - '; then
    current_url=$(echo "$line" | grep -oE 'https?://[^)]+' | head -1)
  # Snippet line: check for event date keywords
  elif [[ -n "$current_url" ]]; then
    if echo "$line" | grep -qiE "(april|may|mai|2026|monday|tuesday|wednesday|thursday|friday|saturday|sunday|vernissage|opening|exhibition|finissage)"; then
      # Only count each unique URL once
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
