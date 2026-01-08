#!/bin/bash
# Sync Nova Sagan Standup notes from Google Drive to local repository
# Downloads only new files that don't exist locally
#
# Usage:
#   ./sync_standups.sh              # Sync new standup notes
#   ./sync_standups.sh --dry-run    # Preview what would be downloaded
#   ./sync_standups.sh --install-cron  # Install cron job for 9 AM daily
#   ./sync_standups.sh --remove-cron   # Remove the cron job

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../../" && pwd)"
REMOTE_NAME="ds-gdrive"
SEARCH_PATTERN="Nova Sagan Standup*"
TARGET_DIR="${PROJECT_ROOT}/digital-science/reflect/nova-sagan-standups"
LOG_DIR="${PROJECT_ROOT}/logs"
LOG_FILE="${LOG_DIR}/standup-sync.log"
EXPORT_FORMAT="md"

# Options
DRY_RUN=false
INSTALL_CRON=false
REMOVE_CRON=false
VERBOSE=false

# Colors for output (disabled in cron/non-TTY)
if [ -t 1 ]; then
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    RED='\033[0;31m'
    NC='\033[0m' # No Color
else
    GREEN=''
    YELLOW=''
    RED=''
    NC=''
fi

log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1"
    if [ -n "$LOG_FILE" ] && [ -d "$(dirname "$LOG_FILE")" ]; then
        echo "[$timestamp] $1" >> "$LOG_FILE"
    fi
}

log_info() {
    log "INFO: $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
    log "SUCCESS: $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    log "WARNING: $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1" >&2
    log "ERROR: $1"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --install-cron)
            INSTALL_CRON=true
            shift
            ;;
        --remove-cron)
            REMOVE_CRON=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            echo "Sync Nova Sagan Standup notes from Google Drive"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --dry-run       Show what would be downloaded without downloading"
            echo "  --install-cron  Install cron job to run at 9 AM daily"
            echo "  --remove-cron   Remove the installed cron job"
            echo "  --verbose, -v   Show detailed output"
            echo "  -h, --help      Show this help message"
            echo ""
            echo "Target directory: ${TARGET_DIR}"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Run '$0 --help' for usage"
            exit 1
            ;;
    esac
done

# Handle cron installation
if [ "$INSTALL_CRON" = true ]; then
    CRON_ENTRY="0 9 * * * ${SCRIPT_DIR}/sync_standups.sh >> ${LOG_FILE} 2>&1"
    
    # Check if already installed
    if crontab -l 2>/dev/null | grep -q "sync_standups.sh"; then
        echo "Cron job already exists. Current schedule:"
        crontab -l | grep "sync_standups.sh"
        exit 0
    fi
    
    # Ensure log directory exists
    mkdir -p "$LOG_DIR"
    
    # Add to crontab
    (crontab -l 2>/dev/null || true; echo "$CRON_ENTRY") | crontab -
    
    log_success "Cron job installed: runs daily at 9:00 AM"
    echo "Entry: $CRON_ENTRY"
    echo ""
    echo "View with: crontab -l | grep sync_standups"
    echo "Remove with: $0 --remove-cron"
    exit 0
fi

if [ "$REMOVE_CRON" = true ]; then
    if ! crontab -l 2>/dev/null | grep -q "sync_standups.sh"; then
        echo "No sync_standups.sh cron job found."
        exit 0
    fi
    
    crontab -l 2>/dev/null | grep -v "sync_standups.sh" | crontab -
    log_success "Cron job removed"
    exit 0
fi

# Check prerequisites
if ! command -v rclone &> /dev/null; then
    log_error "rclone is not installed. Install with: brew install rclone"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    log_error "python3 is not installed"
    exit 1
fi

# Ensure directories exist
mkdir -p "$TARGET_DIR"
mkdir -p "$LOG_DIR"

log_info "Starting standup sync..."
log_info "Target: ${TARGET_DIR}"

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}DRY RUN MODE - No files will be downloaded${NC}"
    echo ""
fi

# Create temp files for data exchange
TEMP_LOCAL=$(mktemp)
TEMP_REMOTE=$(mktemp)
TEMP_NEW=$(mktemp)
trap "rm -f $TEMP_LOCAL $TEMP_REMOTE $TEMP_NEW" EXIT

# Step 1: Get list of existing local files
log_info "Scanning local files..."
find "$TARGET_DIR" -maxdepth 1 -name "*.md" -type f 2>/dev/null | while read -r file; do
    basename "$file"
done > "$TEMP_LOCAL"

LOCAL_COUNT=$(wc -l < "$TEMP_LOCAL" | tr -d ' ')
log_info "Found ${LOCAL_COUNT} local files"

# Step 2: Get list of files from Google Drive shared with me
log_info "Fetching files from Google Drive (Shared with me)..."

rclone lsjson "${REMOTE_NAME}:" --drive-shared-with-me -R 2>/dev/null > "$TEMP_REMOTE" || {
    log_error "Failed to fetch files from Google Drive. Check rclone configuration."
    exit 1
}

# Step 3: Compare and identify new files using Python
PYTHON_OUTPUT=$(python3 << 'PYTHON_SCRIPT' - "$TEMP_LOCAL" "$TEMP_REMOTE" "$TEMP_NEW" "$SEARCH_PATTERN" "$EXPORT_FORMAT" "$VERBOSE"
import json
import sys
import fnmatch
import os

local_file = sys.argv[1]
remote_file = sys.argv[2]
new_file = sys.argv[3]
search_pattern = sys.argv[4]
export_format = sys.argv[5]
verbose = sys.argv[6].lower() == 'true'

# Helper to get base name without common extensions
def get_base_name(filename):
    for ext in ['.md', '.docx', '.doc', '.txt', '.pdf']:
        if filename.lower().endswith(ext):
            return filename[:-len(ext)]
    return filename

# Read local files (filenames) - store base names for comparison
local_base_names = set()
with open(local_file, 'r') as f:
    for line in f:
        name = line.strip()
        if name:
            base = get_base_name(name)
            local_base_names.add(base)

# Read remote files from rclone JSON
with open(remote_file, 'r') as f:
    try:
        remote_data = json.load(f)
    except json.JSONDecodeError:
        print("ERROR: Failed to parse Google Drive response", file=sys.stderr)
        sys.exit(1)

# Filter remote files by pattern and find new ones
remote_count = 0
new_files = []

for item in remote_data:
    name = item.get('Name', '')
    mime = item.get('MimeType', '')
    
    # Skip non-document files (Chat, Recording, etc.) that don't have Notes by Gemini
    is_doc = name.endswith('.docx') or name.endswith('.md') or 'google-apps.document' in mime
    has_notes = 'Notes by Gemini' in name
    if not is_doc and not has_notes:
        continue
    
    # Check if matches pattern
    pattern_lower = search_pattern.lower().rstrip('*')
    if not (fnmatch.fnmatch(name.lower(), search_pattern.lower()) or 
            name.lower().startswith(pattern_lower)):
        continue
    
    remote_count += 1
    
    # Get base name for comparison (strip extensions)
    remote_base = get_base_name(name)
    
    # Determine what the exported filename will be
    if 'google-apps.document' in mime or name.endswith('.docx'):
        export_name = remote_base + '.' + export_format
    else:
        export_name = name
    
    # Check if this file exists locally by comparing base names
    if remote_base not in local_base_names:
        new_files.append({
            'name': name,
            'export_name': export_name,
            'modified': item.get('ModTime', ''),
            'id': item.get('ID', '')
        })

# Sort by modified time (most recent first)
new_files.sort(key=lambda x: x['modified'], reverse=True)

# Write summary to stdout
print(f"REMOTE_COUNT={remote_count}")
print(f"NEW_COUNT={len(new_files)}")

# Write new files list
with open(new_file, 'w') as f:
    for nf in new_files:
        f.write(f"{nf['name']}\n")

# Print new files
for nf in new_files:
    print(f"NEW:{nf['name']}")

PYTHON_SCRIPT
)

REMOTE_COUNT=$(echo "$PYTHON_OUTPUT" | grep "^REMOTE_COUNT=" | cut -d= -f2)
NEW_COUNT=$(echo "$PYTHON_OUTPUT" | grep "^NEW_COUNT=" | cut -d= -f2)

log_info "Found ${REMOTE_COUNT} matching files in Google Drive"
log_info "New files to download: ${NEW_COUNT}"

if [ "$NEW_COUNT" -eq 0 ] || [ -z "$NEW_COUNT" ]; then
    log_success "Already up to date - no new standups to download"
    exit 0
fi

echo ""
echo "New files to download:"
echo "$PYTHON_OUTPUT" | grep "^NEW:" | cut -d: -f2 | while read -r name; do
    echo "  • $name"
done
echo ""

# Step 4: Download new files
if [ "$DRY_RUN" = true ]; then
    log_warning "Dry run complete - ${NEW_COUNT} file(s) would be downloaded"
    exit 0
fi

log_info "Downloading ${NEW_COUNT} new file(s)..."

DOWNLOADED=0
FAILED=0

while read -r name; do
    [ -z "$name" ] && continue
    
    echo "Downloading: $name"
    
    # Strip extension and create glob pattern for include
    # This handles the .docx -> .md conversion by rclone
    BASE_NAME="${name%.*}"
    INCLUDE_PATTERN="${BASE_NAME}*"
    
    if rclone copy "${REMOTE_NAME}:" "$TARGET_DIR" \
        --drive-shared-with-me \
        --include "$INCLUDE_PATTERN" \
        --drive-export-formats "${EXPORT_FORMAT}" \
        2>/dev/null; then
        log_success "Downloaded: $name"
        DOWNLOADED=$((DOWNLOADED + 1))
    else
        log_error "Failed to download: $name"
        FAILED=$((FAILED + 1))
    fi
done < "$TEMP_NEW"

echo ""
log_success "Sync complete!"
echo "  Downloaded: ${DOWNLOADED} file(s)"
if [ "$FAILED" -gt 0 ]; then
    echo "  Failed: ${FAILED} file(s)"
fi
echo "  Target: ${TARGET_DIR}"

# Show recent files
echo ""
echo "Most recent standup files:"
ls -lt "$TARGET_DIR"/*.md 2>/dev/null | head -5
