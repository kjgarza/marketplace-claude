# Coda CLI Reference

Complete reference for the `coda` command-line tool.

## Installation

The CLI should be installed globally. Verify with:

```bash
coda --help
```

If not installed, install from source:

```bash
cd ~/aves/coda-cli && uv tool install .
```

Or run directly without global install:

```bash
cd ~/aves/coda-cli && uv run coda <command>
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CODA_API_KEY` | Your Coda API token | Required |
| `CODA_API_ENDPOINT` | API base URL | `https://coda.io/apis/v1` |
| `CODA_CLI_FORMAT` | Default output format | `conversational` |

## Global Options

These options work with any command:

| Option | Description |
|--------|-------------|
| `--format [conversational|json|csv|table]` | Output format |
| `--config TEXT` | Configuration file path |
| `--ai-snippets` | Show AI agent/Claude skills code snippets |
| `--help` | Show help message |

---

## Authentication Commands

### coda auth status

Show current authentication configuration.

```bash
coda auth status
```

### coda auth test

Test API connection with current credentials.

```bash
coda auth test
```

---

## Document Commands

### coda docs list

List documents accessible to the user.

```bash
coda docs list [OPTIONS]
```

**Options:**
| Option | Description |
|--------|-------------|
| `-q, --query TEXT` | Search term to filter documents |
| `--mine` | Show only documents you own |
| `-l, --limit INTEGER` | Maximum number of results |

**Examples:**
```bash
# List all documents
coda docs list

# Search for PRDs
coda docs list --query "PRD"

# Your documents only
coda docs list --mine

# Limit to 10 results
coda docs list --limit 10
```

### coda docs search

Search for documents by query string.

```bash
coda docs search QUERY
```

**Examples:**
```bash
coda docs search "roadmap"
coda docs search "competitive analysis"
coda docs search "overleaf"
coda docs search "reflect"
```

### coda docs show

Show details for a specific document.

```bash
coda docs show DOC_ID
```

**Example:**
```bash
coda docs show 5CzPMY5OtM
```

---

## Page Commands

### coda pages list

List all pages in a document.

```bash
coda pages list DOC_ID
```

**Example:**
```bash
coda pages list 5CzPMY5OtM
```

### coda pages show

Show details for a specific page.

```bash
coda pages show DOC_ID PAGE_ID
```

**Example:**
```bash
coda pages show 5CzPMY5OtM canvas-xyz
```

### coda pages export

Export page content in HTML or Markdown format.

```bash
coda pages export DOC_ID PAGE_ID [OPTIONS]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--format [html|markdown]` | Export format (default: html) |
| `-o, --output TEXT` | Output file path (prints to console if not specified) |

**Examples:**
```bash
# Print HTML to console
coda pages export 5CzPMY5OtM canvas-xyz

# Print Markdown to console
coda pages export 5CzPMY5OtM canvas-xyz --format markdown

# Save to file
coda pages export 5CzPMY5OtM canvas-xyz --format markdown -o page.md
```

---

## Table Commands

### coda tables list

List all tables in a document.

```bash
coda tables list DOC_ID
```

**Example:**
```bash
coda tables list 5CzPMY5OtM
```

---

## Column Commands

### coda columns list

List columns in a table (shows table schema).

```bash
coda columns list DOC_ID TABLE_ID
```

**Example:**
```bash
coda columns list 5CzPMY5OtM grid-AGKezRqusM
```

---

## Row Commands

### coda rows list

List rows in a table.

```bash
coda rows list DOC_ID TABLE_ID [OPTIONS]
```

**Options:**
| Option | Description |
|--------|-------------|
| `-l, --limit INTEGER` | Maximum number of rows to return |
| `-q, --query TEXT` | Query to filter rows |

**Examples:**
```bash
# List all rows
coda rows list 5CzPMY5OtM grid-AGKezRqusM

# Limit to 10 rows
coda rows list 5CzPMY5OtM grid-AGKezRqusM --limit 10

# Filter rows
coda rows list 5CzPMY5OtM grid-AGKezRqusM --query "status:active"
```

### coda rows show

Show details for a specific row.

```bash
coda rows show DOC_ID TABLE_ID ROW_ID
```

**Example:**
```bash
coda rows show 5CzPMY5OtM grid-AGKezRqusM row-abc123
```

---

## Export Commands

### coda export

Export table data to JSON or CSV format.

```bash
coda export DOC_ID TABLE_ID [OPTIONS]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--format [json|csv]` | Export format (default: json) |
| `-o, --output TEXT` | Output file path (prints to console if not specified) |

**Examples:**
```bash
# Print JSON to console
coda export 5CzPMY5OtM grid-AGKezRqusM

# Print CSV to console
coda export 5CzPMY5OtM grid-AGKezRqusM --format csv

# Save to file
coda export 5CzPMY5OtM grid-AGKezRqusM -o data.json
```

---

## Output Format

The CLI provides AI-friendly conversational outputs by default:

- **Success messages** include resource IDs and suggest next steps
- **Error messages** explain what went wrong and how to fix it
- **Resource listings** provide IDs for use in follow-up commands
- **Suggestions** show exact commands for common next actions

**Example output:**
```
Found 12 documents matching your criteria

Available Resources:
  - Total docs: 12
  - Your docs: 5
  - Shared docs: 7

What's next? Try these commands:
  1. coda docs show AbC123 - View details for "Product Roadmap 2024"
  2. coda tables list AbC123 - List tables in "Product Roadmap 2024"
  3. coda docs search "PRD" - Search for Product Requirements Documents
```

Use `--format json` for machine-readable output suitable for scripting.

---

## Common Workflows

### Find and Read a Document

```bash
# 1. Search for documents
coda docs search "roadmap"

# 2. List pages in the document (using ID from search results)
coda pages list DOC_ID

# 3. Export page content as Markdown
coda pages export DOC_ID PAGE_ID --format markdown
```

### Explore Table Data

```bash
# 1. List tables in document
coda tables list DOC_ID

# 2. View table schema
coda columns list DOC_ID TABLE_ID

# 3. Preview rows
coda rows list DOC_ID TABLE_ID --limit 10

# 4. Export full table
coda export DOC_ID TABLE_ID --format json -o data.json
```

### Export Multiple Tables

```bash
# List tables first
coda tables list DOC_ID

# Export each table as needed
coda export DOC_ID TABLE_1_ID --format json -o table1.json
coda export DOC_ID TABLE_2_ID --format csv -o table2.csv
```

---

## Finding IDs

**Document IDs** can be found:
- In the URL: `coda.io/d/Doc-Name_d<DOC_ID>`
- In the output of `coda docs list` or `coda docs search`

**Page IDs** can be found:
- In the output of `coda pages list DOC_ID`
- Page IDs typically start with `canvas-`

**Table IDs** can be found:
- In the output of `coda tables list DOC_ID`
- Table IDs typically start with `grid-` or `table-`

**Row IDs** can be found:
- In the output of `coda rows list DOC_ID TABLE_ID`

---

## Error Handling

Common errors and solutions:

| Error | Solution |
|-------|----------|
| `command not found: coda` | Install: `cd ~/aves/coda-cli && uv tool install .` |
| `CODA_API_KEY not set` | Run `export CODA_API_KEY="your-key"` |
| `Invalid API key` | Check key at https://coda.io/account |
| `Document not found` | Verify DOC_ID is correct |
| `Table not found` | Run `coda tables list DOC_ID` to get valid table IDs |
| `Page not found` | Run `coda pages list DOC_ID` to get valid page IDs |
| `Row not found` | Run `coda rows list DOC_ID TABLE_ID` to get valid row IDs |

---

## Documentation Links

- Coda API Reference: https://coda.io/developers/apis/v1
- Get API Key: https://coda.io/account
