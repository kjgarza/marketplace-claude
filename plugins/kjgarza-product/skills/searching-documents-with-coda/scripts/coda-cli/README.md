# Coda CLI

An AI-friendly command-line interface for Coda documents with conversational outputs that guide next steps.

## Features

✨ **Conversational Outputs** - Every command suggests next steps with exact commands
🔐 **Guided Authentication** - Interactive setup with API key management
📊 **Rich Terminal Output** - Beautiful tables, colors, and formatted displays
📤 **Multiple Export Formats** - JSON, CSV, Excel, and Claude skill-compatible code
🔍 **Smart Search** - Find documents and tables with intelligent filtering
🤖 **AI Agent Friendly** - Outputs designed as prompts for automated workflows

## Quick Start

### Installation

```bash
# Clone or navigate to the project directory
cd coda-cli

# Install with uv (recommended)
uv sync

# That's it! Use 'uv run coda' to execute commands
```

### Authentication Setup

```bash
uv run coda auth setup
```

This will guide you through:
1. Getting your API key from https://coda.io/account
2. Testing the connection
3. Saving to your shell profile

### Basic Usage

```bash
# List your documents
uv run coda docs list

# Search for documents
uv run coda docs search "PRD"

# View document details
uv run coda doc show AbC123

# List tables in a document
uv run coda tables list AbC123

# Export table data
uv run coda export AbC123 grid-xyz789 --format json
```

## Command Reference

### Document Commands

```bash
coda docs list [--query TEXT] [--mine] [--limit N]
coda docs search QUERY
coda doc show DOC_ID
```

### Table Commands

```bash
coda tables list DOC_ID
coda table show DOC_ID TABLE_ID
coda export DOC_ID TABLE_ID [--format json|csv|excel]
```

### Authentication Commands

```bash
coda auth setup    # Interactive setup
coda auth test     # Test current authentication
coda auth status   # Show current configuration
```

## AI-Friendly Design

Every command output follows the "Every Output is a Prompt" pattern:

✅ **Success messages** include resource IDs and suggest next steps
❌ **Error messages** explain what went wrong, how to fix it, and what to try next
📋 **Resource listings** provide IDs for use in follow-up commands
💡 **Suggestions** show exact commands for common next actions

Example output:
```
✅ Found 12 documents matching your criteria

📋 Available Resources:
  • Total docs: 12
  • Your docs: 5
  • Shared docs: 7

💡 What's next? Try these commands:
  1. coda doc show AbC123 - View details for "Product Roadmap 2024"
  2. coda tables list AbC123 - List tables in "Product Roadmap 2024"
  3. coda docs search "PRD" - Search for Product Requirements Documents
```

## Integration with Existing Workflows

Compatible with existing `.claude/skills/coda/` patterns:
- Uses same `CODA_API_KEY` environment variable
- Generates skill-compatible code snippets
- Supports same `codaio` library operations

## Development

```bash
# Install with development dependencies
uv sync --dev

# Activate virtual environment
source .venv/bin/activate

# Run tests
uv run pytest

# Format and lint code
uv run ruff format src/ tests/
uv run ruff check src/ tests/

# Type checking
uv run mypy src/

# Install pre-commit hooks
uv run pre-commit install
```

## Configuration

The CLI respects these environment variables:
- `CODA_API_KEY` - Your Coda API token (required)
- `CODA_API_ENDPOINT` - API base URL (optional)
- `CODA_CLI_FORMAT` - Default output format (optional)

Configuration file: `~/.coda/cli-config.yaml`