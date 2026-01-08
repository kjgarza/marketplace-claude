#!/bin/bash
# Search for files in Google Drive using rclone
# Usage: ./search_gdrive.sh <search_pattern> [options]
# Examples:
#   ./search_gdrive.sh "report"                    # Search for files containing "report" in name
#   ./search_gdrive.sh "*.md" --path "Documents"   # Search for .md files in Documents folder
#   ./search_gdrive.sh "budget" --shared           # Search in "Shared with me"
#   ./search_gdrive.sh "report" --remote work      # Search in remote named "work"

set -e

# Default values
SEARCH_PATTERN=""
SEARCH_PATH=""
REMOTE_NAME="gdrive"
SHARED=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --shared)
            SHARED=true
            shift
            ;;
        --path)
            SEARCH_PATH="$2"
            shift 2
            ;;
        --remote)
            REMOTE_NAME="$2"
            shift 2
            ;;
        -h|--help)
            echo "Search for files in Google Drive using rclone"
            echo ""
            echo "Usage: $0 <search_pattern> [options]"
            echo ""
            echo "Arguments:"
            echo "  search_pattern  Pattern to search for (supports glob patterns like *.md)"
            echo ""
            echo "Options:"
            echo "  --path PATH     Subfolder path to search in"
            echo "  --shared        Search in 'Shared with me' instead of My Drive"
            echo "  --remote NAME   Name of rclone remote (default: gdrive)"
            echo ""
            echo "Examples:"
            echo "  $0 'report'                      # Find files with 'report' in name"
            echo "  $0 '*.docx' --path 'Work'        # Find .docx files in Work folder"
            echo "  $0 'Meeting Notes' --shared      # Find shared files with 'Meeting Notes'"
            echo "  $0 'budget' --path 'Finance'     # Find files with 'budget' in Finance folder"
            exit 0
            ;;
        *)
            if [ -z "$SEARCH_PATTERN" ]; then
                SEARCH_PATTERN="$1"
            fi
            shift
            ;;
    esac
done

if [ -z "$SEARCH_PATTERN" ]; then
    echo "ERROR: Search pattern is required"
    echo "Run '$0 --help' for usage"
    exit 1
fi

# Build the remote path
if [ -n "$SEARCH_PATH" ]; then
    FULL_PATH="${REMOTE_NAME}:${SEARCH_PATH}"
else
    FULL_PATH="${REMOTE_NAME}:"
fi

# Build rclone options
RCLONE_OPTS="--recursive"
if [ "$SHARED" = true ]; then
    RCLONE_OPTS="$RCLONE_OPTS --drive-shared-with-me"
    echo "Searching for '${SEARCH_PATTERN}' in Shared with me..."
else
    echo "Searching for '${SEARCH_PATTERN}' in ${FULL_PATH}..."
fi
echo ""

# Use rclone lsjson for structured output, filter by name pattern
# --recursive searches all subdirectories
# Output: Path, Size, ModTime, MimeType, ID
rclone lsjson "${FULL_PATH}" ${RCLONE_OPTS} 2>/dev/null | \
    python3 -c "
import json
import sys
import fnmatch

pattern = '${SEARCH_PATTERN}'.lower()
data = json.load(sys.stdin)

results = []
for item in data:
    name = item.get('Name', '').lower()
    path = item.get('Path', '')

    # Match by glob pattern or substring
    if fnmatch.fnmatch(name, pattern) or pattern in name:
        results.append({
            'path': path,
            'name': item.get('Name', ''),
            'size': item.get('Size', 0),
            'modified': item.get('ModTime', ''),
            'mime': item.get('MimeType', ''),
            'id': item.get('ID', '')
        })

if not results:
    print('No files found matching the pattern.')
    sys.exit(0)

print(f'Found {len(results)} file(s):')
print('')

for r in results:
    size_str = f\"{r['size']:,} bytes\" if r['size'] > 0 else 'Google Doc'
    mime_short = r['mime'].split('.')[-1] if r['mime'] else 'unknown'
    print(f\"  {r['path']}\")
    print(f\"    Type: {mime_short} | Size: {size_str}\")
    print(f\"    ID: {r['id']}\")
    print('')
"
