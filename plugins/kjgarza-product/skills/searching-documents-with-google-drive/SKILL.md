---
name: searching-documents-with-google-drive
description: Search and download documents from Google Drive using rclone. Exports Google Docs as Markdown by default. Use when users ask to find files in Google Drive, download documents from Drive, export Google Docs, or sync Drive content locally. Triggers on requests mentioning Google Drive, gdrive, or document downloads from cloud storage.
---

# Google Drive Document Access

## Overview

Search for and download documents from Google Drive using rclone. Google Docs are automatically exported as Markdown for easy reading and processing.

Scripts are located at `scripts/`.

**Reference Documentation:**
- [scripts/](scripts/) — Shell scripts for search, download, and sync operations
- [digital-science-reference.md](digital-science-reference.md) — Digital Science documentation links

**Authentication:** See the Authentication section in [digital-science-reference.md](digital-science-reference.md) for rclone setup. The remote must be named `gdrive`.

## Quick Start

```bash
# Check rclone is configured
./scripts/check_rclone.sh

# Search for files
./scripts/search_gdrive.sh "meeting notes"

# Search shared files
./scripts/search_gdrive.sh "standup" --shared

# Download a file (exports Google Docs as Markdown)
./scripts/download_gdrive.sh "Documents/Report" ./output

# Download by file ID
./scripts/download_gdrive.sh --id "FILE_ID" ./output

# Download matching shared files
./scripts/download_gdrive.sh --shared --include "pattern*" ./output
```

## Common Tasks

| Task | Command |
|------|---------|
| Check setup | `./scripts/check_rclone.sh` |
| Search files | `./scripts/search_gdrive.sh "pattern"` |
| Search shared files | `./scripts/search_gdrive.sh "pattern" --shared` |
| Download file | `./scripts/download_gdrive.sh "path/to/file" ./output` |
| Download by ID | `./scripts/download_gdrive.sh --id "FILE_ID" ./output` |
| Download folder | `./scripts/download_gdrive.sh "Folder" ./output --bulk` |
| Download shared files | `./scripts/download_gdrive.sh --shared --include "pattern*" ./output` |
| Limit downloads | `./scripts/download_gdrive.sh --shared --include "pattern*" ./output --limit 20` |

## Export Formats

Google Docs can be exported in different formats:

| Format | Flag | Use Case |
|--------|------|----------|
| Markdown | `--format md` (default) | Easy reading and processing |
| Word | `--format docx` | Office compatibility |
| PDF | `--format pdf` | Final documents |
| Plain text | `--format txt` | Minimal formatting |
| HTML | `--format html` | Web content |

Example: `./scripts/download_gdrive.sh "Report" ./output --format docx`

## File ID Extraction

Extract file IDs from Google Drive URLs:
- `https://docs.google.com/document/d/FILE_ID/edit` → use FILE_ID
- `https://drive.google.com/file/d/FILE_ID/view` → use FILE_ID

## Preview Before Download

Use dry-run to see what would be downloaded:
```bash
./scripts/download_gdrive.sh "Large Folder" ./output --bulk --dry-run
```

## Direct rclone Commands

For advanced use cases:
```bash
rclone ls gdrive:"Documents"           # List files
rclone lsjson gdrive:"path" --no-traverse  # Get file info as JSON
rclone sync gdrive:"Source" ./local --drive-export-formats md  # Sync folder
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "remote not configured" | Run `rclone config` to set up gdrive remote |
| "Cannot connect" | Run `rclone config reconnect gdrive:` |
| Empty search results | Check path spelling; try searching from root |
| File not downloading | Verify file permissions; check if file is in Trash |
| Shared files not found | Use `--shared` flag |
| Too many files | Use `--limit N` to download only N most recent |
