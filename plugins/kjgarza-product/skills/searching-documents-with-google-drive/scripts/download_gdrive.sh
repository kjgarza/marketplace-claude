#!/bin/bash
# Download files from Google Drive using rclone, exporting Google Docs as Markdown
# Usage: ./download_gdrive.sh <source> <destination> [options]
#
# Examples:
#   ./download_gdrive.sh "Docs/Report" ./output                    # Download by path
#   ./download_gdrive.sh --id "1abc123xyz" ./output                # Download by file ID
#   ./download_gdrive.sh "Project Folder" ./output --bulk          # Download entire folder
#   ./download_gdrive.sh --shared --include "Meeting*" ./output    # Download shared files by pattern
#   ./download_gdrive.sh --shared --include "Notes*" ./output --limit 20  # Download last 20 matching

set -e

# Default values
REMOTE_NAME="gdrive"
EXPORT_FORMAT="md"
BY_ID=false
BULK=false
DRY_RUN=false
SHARED=false
INCLUDE_PATTERN=""
LIMIT=0
SOURCE=""
DEST=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --id)
            BY_ID=true
            shift
            ;;
        --remote)
            REMOTE_NAME="$2"
            shift 2
            ;;
        --format)
            EXPORT_FORMAT="$2"
            shift 2
            ;;
        --bulk)
            BULK=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --shared)
            SHARED=true
            shift
            ;;
        --include)
            INCLUDE_PATTERN="$2"
            shift 2
            ;;
        --limit)
            LIMIT="$2"
            shift 2
            ;;
        -h|--help)
            echo "Download files from Google Drive, exporting Google Docs as Markdown"
            echo ""
            echo "Usage: $0 <source> <destination> [options]"
            echo "       $0 --shared --include <pattern> <destination> [options]"
            echo ""
            echo "Arguments:"
            echo "  source       Path in Drive (e.g., 'Docs/Report') or file ID with --id"
            echo "  destination  Local directory to save files"
            echo ""
            echo "Options:"
            echo "  --id           Treat source as a Google Drive file ID"
            echo "  --remote NAME  rclone remote name (default: gdrive)"
            echo "  --format FMT   Export format for Google Docs (default: md)"
            echo "                 Options: md, docx, pdf, txt, html"
            echo "  --bulk         Download entire folder recursively"
            echo "  --dry-run      Show what would be downloaded without downloading"
            echo "  --shared       Access files in 'Shared with me' instead of My Drive"
            echo "  --include PAT  Download files matching pattern (required with --shared)"
            echo "  --limit N      Download only the N most recent matching files"
            echo ""
            echo "Examples:"
            echo "  $0 'Documents/Report' ./downloads"
            echo "  $0 --id '1abc123xyz' ./downloads"
            echo "  $0 'Project Files' ./project --bulk"
            echo "  $0 'Notes' ./notes --format txt"
            echo "  $0 --shared --include 'Meeting Notes 2025*' ./output"
            echo "  $0 --shared --include 'Standup*' ./output --limit 20"
            exit 0
            ;;
        *)
            if [ -z "$SOURCE" ] && [ "$SHARED" = false ]; then
                SOURCE="$1"
            elif [ -z "$DEST" ]; then
                DEST="$1"
            fi
            shift
            ;;
    esac
done

# Validate inputs
if [ "$SHARED" = true ]; then
    if [ -z "$INCLUDE_PATTERN" ]; then
        echo "ERROR: --include pattern is required when using --shared"
        echo "Run '$0 --help' for usage"
        exit 1
    fi
    if [ -z "$DEST" ]; then
        echo "ERROR: Destination is required"
        echo "Run '$0 --help' for usage"
        exit 1
    fi
else
    if [ -z "$SOURCE" ] || [ -z "$DEST" ]; then
        echo "ERROR: Source and destination are required"
        echo "Run '$0 --help' for usage"
        exit 1
    fi
fi

# Create destination directory if it doesn't exist
mkdir -p "$DEST"

# Build base rclone options
RCLONE_OPTS="--drive-export-formats ${EXPORT_FORMAT} --progress"

if [ "$DRY_RUN" = true ]; then
    RCLONE_OPTS="$RCLONE_OPTS --dry-run"
fi

# Handle shared files with pattern matching
if [ "$SHARED" = true ]; then
    echo "Downloading from Shared with me..."
    echo "Pattern: ${INCLUDE_PATTERN}"
    echo "Destination: ${DEST}"
    echo "Export format: ${EXPORT_FORMAT}"

    if [ "$LIMIT" -gt 0 ]; then
        echo "Limit: ${LIMIT} most recent files"
        echo ""
        echo "Finding matching files..."

        # For shared files with --limit, we need to:
        # 1. First identify which files to keep (most recent N)
        # 2. Download all matching files
        # 3. Remove files not in the keep list

        # Get list of files to keep (most recent N)
        KEEP_LIST=$(mktemp)
        trap "rm -f $KEEP_LIST" EXIT

        rclone lsjson "${REMOTE_NAME}:" --drive-shared-with-me -R 2>/dev/null | \
            python3 -c "
import json
import sys
import fnmatch

pattern = '''${INCLUDE_PATTERN}'''
limit = ${LIMIT}
export_format = '''${EXPORT_FORMAT}'''

data = json.load(sys.stdin)

# Filter by pattern (case insensitive)
results = []
for item in data:
    name = item.get('Name', '')
    if fnmatch.fnmatch(name.lower(), pattern.lower()) or pattern.lower() in name.lower():
        results.append({
            'name': name,
            'modified': item.get('ModTime', ''),
        })

# Sort by modified time descending (most recent first)
results.sort(key=lambda x: x['modified'], reverse=True)

if not results:
    print('NO_MATCHES', file=sys.stderr)
    sys.exit(1)

print(f'Found {len(results)} total matching files', file=sys.stderr)
print(f'Will keep {min(limit, len(results))} most recent', file=sys.stderr)

# Output the filenames to keep (with export extension)
for r in results[:limit]:
    # Convert .docx to export format extension
    name = r['name']
    if name.endswith('.docx'):
        name = name[:-5] + '.' + export_format
    print(name)
" > "$KEEP_LIST"

        if [ ! -s "$KEEP_LIST" ]; then
            echo "No files found matching the pattern."
            exit 0
        fi

        echo "Downloading all matching files..."
        rclone copy "${REMOTE_NAME}:" "$DEST" \
            --drive-shared-with-me \
            --include "${INCLUDE_PATTERN}" \
            $RCLONE_OPTS

        echo ""
        echo "Removing files beyond the limit..."
        # Remove files not in the keep list
        python3 -c "
import os
import sys

dest = '''${DEST}'''
keep_file = '''${KEEP_LIST}'''

# Read files to keep
with open(keep_file) as f:
    keep_files = set(line.strip() for line in f if line.strip())

# Get all files in destination
removed = 0
for filename in os.listdir(dest):
    filepath = os.path.join(dest, filename)
    if os.path.isfile(filepath) and filename not in keep_files:
        os.remove(filepath)
        removed += 1

if removed > 0:
    print(f'Removed {removed} files (keeping {len(keep_files)} most recent)')
"
    else
        echo ""
        # No limit - download all matching files
        rclone copy "${REMOTE_NAME}:" "$DEST" \
            --drive-shared-with-me \
            --include "${INCLUDE_PATTERN}" \
            $RCLONE_OPTS
    fi

elif [ "$BY_ID" = true ]; then
    # Download by file ID using --drive-root-folder-id trick
    echo "Downloading file with ID: ${SOURCE}"
    echo "Destination: ${DEST}"
    echo "Export format: ${EXPORT_FORMAT}"
    echo ""

    # For a single file, we use the ID as root folder
    rclone copy "${REMOTE_NAME}:" "${DEST}" \
        --drive-root-folder-id "${SOURCE}" \
        ${RCLONE_OPTS}
else
    # Download by path
    FULL_SOURCE="${REMOTE_NAME}:${SOURCE}"

    echo "Downloading: ${FULL_SOURCE}"
    echo "Destination: ${DEST}"
    echo "Export format: ${EXPORT_FORMAT}"
    if [ "$BULK" = true ]; then
        echo "Mode: Bulk (entire folder)"
    fi
    echo ""

    rclone copy "${FULL_SOURCE}" "${DEST}" ${RCLONE_OPTS}
fi

if [ "$DRY_RUN" = false ]; then
    echo ""
    echo "Download complete. Files saved to: ${DEST}"
    ls -la "${DEST}"
fi
