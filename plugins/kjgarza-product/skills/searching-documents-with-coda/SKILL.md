---
name: searching-documents-with-coda
description: Search and extract content from Coda documents including PRDs, roadmaps, competitive analyses, and research docs. Use when user wants to find documents in Coda, list pages and tables, export content as Markdown/HTML/JSON/CSV, or access structured data from Coda workspace. Triggers on "find in Coda", "search Coda", "Coda document", "export from Coda", or references to product documentation.
---

# Overview

Query and export content from Coda documents using the `coda` CLI. Supports searching documents, listing pages and tables, exporting page content as Markdown/HTML, and exporting table data as JSON/CSV.

**Reference Documentation:**
- [coda-reference.md](coda-reference.md) — Full command reference with all options
- [digital-science-reference.md](digital-science-reference.md) — Digital Science documentation links

**Authentication:** Requires `CODA_API_KEY` environment variable. Get your key at https://coda.io/account

# Quick Start

```bash
# Verify authentication
coda auth status

# Search for documents
coda docs search "PRD"

# List pages in a document
coda pages list DOC_ID

# Export page as Markdown
coda pages export DOC_ID PAGE_ID --format markdown

# Export table data as JSON
coda export DOC_ID TABLE_ID --format json
```

# Command Reference

## Document Commands

| Command | Description |
|---------|-------------|
| `coda docs list` | List all accessible documents |
| `coda docs list --query "PRD"` | Search documents by name |
| `coda docs list --mine` | Show only your documents |
| `coda docs list --limit 10` | Limit results |
| `coda docs search "roadmap"` | Search documents by query |
| `coda docs show DOC_ID` | Show document details |

## Page Commands

| Command | Description |
|---------|-------------|
| `coda pages list DOC_ID` | List all pages in document |
| `coda pages show DOC_ID PAGE_ID` | Show page details |
| `coda pages export DOC_ID PAGE_ID` | Export page as HTML (default) |
| `coda pages export DOC_ID PAGE_ID --format markdown` | Export page as Markdown |
| `coda pages export DOC_ID PAGE_ID -o page.md` | Save to file |

## Table Commands

| Command | Description |
|---------|-------------|
| `coda tables list DOC_ID` | List all tables in document |
| `coda columns list DOC_ID TABLE_ID` | Show table schema/columns |
| `coda rows list DOC_ID TABLE_ID` | List all rows in table |
| `coda rows list DOC_ID TABLE_ID --limit 10` | Limit rows returned |
| `coda rows list DOC_ID TABLE_ID --query "filter"` | Filter rows |
| `coda rows show DOC_ID TABLE_ID ROW_ID` | Show specific row details |

## Export Commands

| Command | Description |
|---------|-------------|
| `coda export DOC_ID TABLE_ID` | Export table as JSON (console) |
| `coda export DOC_ID TABLE_ID --format csv` | Export as CSV |
| `coda export DOC_ID TABLE_ID -o data.json` | Save to file |

## Authentication Commands

| Command | Description |
|---------|-------------|
| `coda auth status` | Show current configuration |
| `coda auth test` | Test API connection |

# Common Workflows

## Find and Read a Document

```bash
# 1. Search for the document
coda docs search "product roadmap"

# 2. List pages in the document
coda pages list DOC_ID

# 3. Export page content as Markdown
coda pages export DOC_ID PAGE_ID --format markdown
```

## Extract Table Data

```bash
# 1. List tables in document
coda tables list DOC_ID

# 2. View table schema
coda columns list DOC_ID TABLE_ID

# 3. Export table data
coda export DOC_ID TABLE_ID --format json -o data.json
```

## Browse Table Rows

```bash
# List first 20 rows
coda rows list DOC_ID TABLE_ID --limit 20

# Filter rows
coda rows list DOC_ID TABLE_ID --query "status:active"

# Show specific row details
coda rows show DOC_ID TABLE_ID ROW_ID
```

# Common Searches

| Task | Command |
|------|---------|
| Find PRDs | `coda docs search "PRD"` |
| Find roadmaps | `coda docs search "roadmap"` |
| Find competitive analysis | `coda docs search "competitive"` |
| Find research docs | `coda docs search "research"` |
| Find Overleaf/Nova docs | `coda docs search "overleaf"` or `"nova"` |
| Find Reflect docs | `coda docs search "reflect"` |

# Global Options

| Option | Description |
|--------|-------------|
| `--format conversational` | Human-readable output (default) |
| `--format json` | Machine-readable JSON output |
| `--format csv` | CSV output |
| `--format table` | Tabular output |
| `--ai-snippets` | Show AI agent code snippets |

# Tips

- **Document IDs** are in the URL: `coda.io/d/Doc-Name_d<DOC_ID>`
- **Page IDs** start with `canvas-` (found via `pages list`)
- **Table IDs** start with `grid-` or `table-` (found via `tables list`)
- **Row IDs** are shown in `rows list` output
- Use `--format json` for machine-readable output
- Export pages as Markdown for easy reading

# Installation

If `coda` command is not found, install from source:

```bash
cd ~/aves/coda-cli && uv tool install .
```

Or run directly without global install:

```bash
cd ~/aves/coda-cli && uv run coda <command>
```

# Error Handling

| Error | Solution |
|-------|----------|
| `command not found: coda` | Install: `cd ~/aves/coda-cli && uv tool install .` |
| `CODA_API_KEY not set` | Run `export CODA_API_KEY="your-key"` |
| `Invalid API key` | Get new key at https://coda.io/account |
| `Document not found` | Verify DOC_ID from URL or search results |
| `Table not found` | Run `coda tables list DOC_ID` for valid IDs |
| `Page not found` | Run `coda pages list DOC_ID` for valid IDs |
