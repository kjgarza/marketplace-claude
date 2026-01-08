---
name: cli-generator
description: Generate AI-friendly Python CLIs using Click, Pydantic, and uv. Use when user wants to create a new CLI tool that follows best practices for agentic coding environments.
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
---

# AI-Friendly CLI Generator Skill

Generate Python command-line interfaces optimized for AI agents and agentic coding environments.

## Core Principle: Every Output is a Prompt

In an agentic coding environment, every interaction with a CLI tool is a turn in a conversation. The tool's output—whether it succeeds or fails—should be designed as a helpful, guiding prompt for the agent's next action.

## Tech Stack

- **Python** - Primary language
- **Click** - CLI framework
- **Pydantic** - Data validation and response models
- **Rich** - Terminal formatting and tables
- **uv** - Package management

## Project Structure

```
my-cli/
├── pyproject.toml
├── README.md
├── src/
│   └── my_cli/
│       ├── __init__.py
│       ├── main.py              # CLI entry point
│       ├── commands/            # Command modules
│       │   └── __init__.py
│       ├── models/
│       │   ├── __init__.py
│       │   └── responses.py     # Pydantic response models
│       ├── output/
│       │   ├── __init__.py
│       │   └── conversational.py # AI-friendly output
│       └── core/
│           ├── __init__.py
│           ├── client.py        # API client
│           └── config.py        # Configuration
└── tests/
```

## Quick Start

1. Create project directory:
```bash
mkdir my-cli && cd my-cli
```

2. Initialize with uv:
```bash
uv init
```

3. Add dependencies to `pyproject.toml`:
```toml
dependencies = [
    "click>=8.1.0",
    "rich>=13.0.0",
    "pydantic>=2.0.0",
]
```

4. Create the source structure:
```bash
mkdir -p src/my_cli/{commands,models,output,core}
touch src/my_cli/__init__.py
touch src/my_cli/{commands,models,output,core}/__init__.py
```

5. Copy templates from `templates/` directory

## AI-Friendly Output Patterns

### Pattern 1: Success Output

A successful output confirms the action AND suggests next steps with exact commands:

**Bad (Traditional):**
```
Success!
```

**Good (AI-Friendly):**
```
✅ Found 4 documents matching 'AI'

📋 Available Resources:
  • Total documents: 4
  • First document ID: 2oLo0Z72BR
  • First document name: AI experience design

📊 Results:
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━┳━━━━━━━━━━━━┓
┃ Name                        ┃ ID         ┃ Updated    ┃
┡━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━╇━━━━━━━━━━━━┩
│ AI experience design        │ 2oLo0Z72BR │ 2025-11-26 │
└─────────────────────────────┴────────────┴────────────┘

💡 What's next? Try these commands:
  1. 👁️ mycli show 2oLo0Z72BR - View document details
  2. 📤 mycli export 2oLo0Z72BR --format json - Export as JSON
```

### Pattern 2: Error Output (Three Parts)

Every error must include:
1. **What went wrong** - Clear description
2. **How to fix** - Step-by-step instructions
3. **What's next** - Commands to try after fixing

**Example:**
```
❌ Command failed
   Authentication error

🔍 What went wrong:
  The Coda API returned an error: API key is invalid or expired.

🔧 How to fix:
  1. Check your internet connection
  2. Verify your API key is correct
  3. Try regenerating your API token

💡 What's next:
  • mycli auth test - Test your authentication
  • mycli auth setup - Re-run interactive setup
```

### Pattern 3: Help Text with Examples

Always include working examples in `--help`:

```python
@click.command(
    epilog="""
Examples:
    # Search for documents
    mycli search "machine learning"

    # Export a table as JSON
    mycli export DOC_ID TABLE_ID --format json

    # List all your documents
    mycli list --mine
"""
)
def search(query: str):
    """Search for documents matching a query."""
    pass
```

## Code Patterns

### Response Models (`models/responses.py`)

```python
"""Pydantic models for CLI command responses."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class Suggestion(BaseModel):
    """A suggested next command with description."""
    command: str = Field(..., description="The exact command to run")
    description: str = Field(..., description="What the command does")
    category: Optional[str] = Field(None, description="Category: view, export, search, etc.")


class ErrorDetail(BaseModel):
    """Detailed error following 'what/how/next' pattern."""
    what_went_wrong: str = Field(..., description="Clear explanation of the failure")
    how_to_fix: List[str] = Field(..., description="Step-by-step fix instructions")
    whats_next: List[Suggestion] = Field(..., description="Commands to try after fixing")
    error_code: Optional[str] = Field(None, description="Machine-readable error code")


class CommandResult(BaseModel):
    """Result of a CLI command with conversational context."""
    success: bool = Field(..., description="Whether command succeeded")
    message: str = Field(..., description="Primary result message")
    context: Dict[str, Any] = Field(default_factory=dict, description="Resource IDs and metadata")
    data: Optional[List[Any]] = Field(None, description="Structured data results")
    suggestions: List[Suggestion] = Field(default_factory=list, description="Suggested next commands")
    error: Optional[ErrorDetail] = Field(None, description="Error details if failed")
```

### Conversational Output (`output/conversational.py`)

```python
"""Conversational output following 'Every Output is a Prompt' pattern."""

from typing import Any, Optional, List
from rich.console import Console
from rich.table import Table
from .responses import CommandResult, Suggestion


class ConversationalOutput:
    """Output manager that makes every interaction conversational."""

    def __init__(self, console: Console, show_suggestions: bool = True):
        self.console = console
        self.show_suggestions = show_suggestions

    def success(self, result: CommandResult) -> None:
        """Display success with context and suggestions."""
        # Main success message
        self.console.print(f"✅ {result.message}", style="bold green")

        # Show context (resource IDs, counts, etc.)
        if result.context:
            self.console.print("\n📋 Available Resources:", style="bold blue")
            for key, value in result.context.items():
                self.console.print(f"  • {key}: [cyan]{value}[/cyan]")

        # Show data in table format
        if result.data:
            self._render_data(result.data)

        # Show suggested next commands
        if self.show_suggestions and result.suggestions:
            self._render_suggestions(result.suggestions)

    def error(self, result: CommandResult) -> None:
        """Display error with three-part pattern."""
        if not result.error:
            self.console.print(f"❌ {result.message}", style="bold red")
            return

        error = result.error

        # What went wrong
        self.console.print("❌ Command failed", style="bold red")
        self.console.print(f"   {result.message}")
        self.console.print("\n🔍 What went wrong:", style="bold yellow")
        self.console.print(f"  {error.what_went_wrong}")

        # How to fix
        if error.how_to_fix:
            self.console.print("\n🔧 How to fix:", style="bold green")
            for i, step in enumerate(error.how_to_fix, 1):
                self.console.print(f"  {i}. {step}")

        # What's next
        if error.whats_next:
            self.console.print("\n💡 What's next:", style="bold blue")
            for suggestion in error.whats_next:
                self.console.print(
                    f"  • [cyan]{suggestion.command}[/cyan] - {suggestion.description}"
                )

    def _render_data(self, data: List[Any]) -> None:
        """Render structured data as a table."""
        if not data:
            return

        self.console.print("\n📊 Results:", style="bold blue")
        table = Table(show_header=True, header_style="bold magenta")

        # Build table from first item's keys
        if isinstance(data[0], dict):
            for key in list(data[0].keys())[:5]:  # Limit columns
                table.add_column(key.replace("_", " ").title())

            for item in data[:10]:  # Limit rows
                table.add_row(*[str(v)[:40] for v in list(item.values())[:5]])

        self.console.print(table)

    def _render_suggestions(self, suggestions: List[Suggestion]) -> None:
        """Render suggested next commands."""
        self.console.print("\n💡 What's next? Try these commands:", style="bold yellow")

        emoji_map = {
            "view": "👁️", "export": "📤", "search": "🔍",
            "create": "✨", "edit": "✏️", "auth": "🔐",
        }

        for i, s in enumerate(suggestions[:5], 1):
            emoji = emoji_map.get(s.category, "")
            self.console.print(f"  {i}. {emoji}[cyan]{s.command}[/cyan] - {s.description}")
```

### Main CLI Entry Point (`main.py`)

```python
"""Main CLI entry point."""

import click
from rich.console import Console

from .models.responses import CommandResult, Suggestion, ErrorDetail
from .output.conversational import ConversationalOutput

console = Console()
output = ConversationalOutput(console)


@click.group()
@click.version_option()
def cli():
    """My CLI tool - AI-friendly command interface.

    Examples:
        mycli search "query"
        mycli show RESOURCE_ID
        mycli export RESOURCE_ID --format json
    """
    pass


@cli.command(epilog="""
Examples:
    mycli search "machine learning"
    mycli search "climate" --limit 5
""")
@click.argument("query")
@click.option("--limit", default=10, help="Maximum results to return")
def search(query: str, limit: int):
    """Search for resources matching a query."""
    try:
        # Your search logic here
        results = []  # fetch_results(query, limit)

        result = CommandResult(
            success=True,
            message=f"Found {len(results)} results for '{query}'",
            context={
                "Query": query,
                "Total results": len(results),
            },
            data=results,
            suggestions=[
                Suggestion(
                    command=f"mycli show {results[0]['id']}" if results else "mycli list",
                    description="View details" if results else "List all resources",
                    category="view"
                ),
                Suggestion(
                    command=f"mycli export {results[0]['id']} --format json" if results else "mycli search 'other'",
                    description="Export as JSON" if results else "Try another search",
                    category="export" if results else "search"
                ),
            ]
        )
        output.success(result)

    except Exception as e:
        result = CommandResult(
            success=False,
            message="Search failed",
            error=ErrorDetail(
                what_went_wrong=str(e),
                how_to_fix=[
                    "Check your query syntax",
                    "Verify your authentication",
                ],
                whats_next=[
                    Suggestion(command="mycli auth test", description="Test authentication", category="auth"),
                ]
            )
        )
        output.error(result)


if __name__ == "__main__":
    cli()
```

## pyproject.toml Template

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "my-cli"
version = "0.1.0"
description = "AI-friendly CLI tool"
requires-python = ">=3.8"
dependencies = [
    "click>=8.1.0",
    "rich>=13.0.0",
    "pydantic>=2.0.0",
    "python-dotenv>=1.0.0",
]

[project.scripts]
mycli = "my_cli.main:cli"

[tool.hatch.build.targets.wheel]
packages = ["src/my_cli"]
```

## Reference Implementation

See the `coda-cli` project for a complete working example:
- Location: `.claude/skills/coda/scripts/coda-cli/`
- Key files:
  - `src/coda_cli/output/conversational.py` - Full output implementation
  - `src/coda_cli/models/responses.py` - Complete response models
  - `pyproject.toml` - Project configuration

## Checklist for New CLIs

- [ ] Every success output includes suggested next commands
- [ ] Every error includes: what went wrong, how to fix, what's next
- [ ] All commands have `epilog` with usage examples
- [ ] Response models use Pydantic for validation
- [ ] Rich is used for formatted terminal output
- [ ] Context includes resource IDs for follow-up commands
- [ ] Table output is limited to prevent overwhelming agents
