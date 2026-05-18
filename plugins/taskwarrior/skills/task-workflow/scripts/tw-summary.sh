#!/usr/bin/env bash
# Print a quick task summary: counts by project, overdue tasks, and due today.

set -euo pipefail

echo "=== Task Summary ==="
echo ""

echo "--- By Project ---"
task summary 2>/dev/null || task projects 2>/dev/null || echo "(no projects)"

echo ""
echo "--- Overdue ---"
task +OVERDUE list 2>/dev/null || echo "(none)"

echo ""
echo "--- Due Today ---"
task +TODAY list 2>/dev/null || echo "(none)"

echo ""
echo "--- Active (started) ---"
task +ACTIVE list 2>/dev/null || echo "(none)"

echo ""
echo "--- Next Up ---"
task next limit:5 2>/dev/null || task next 2>/dev/null || echo "(none)"
