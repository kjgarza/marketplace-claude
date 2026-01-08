"""Conversational output system that follows 'Every Output is a Prompt' pattern."""

import json
from typing import Any, Optional

from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from ..models.responses import CommandResult, Suggestion


class ConversationalOutput:
    """Output manager that makes every interaction conversational and actionable."""

    def __init__(
        self,
        console: Console,
        show_suggestions: bool = True,
        show_context: bool = True,
    ):
        self.console = console
        self.show_suggestions = show_suggestions
        self.show_context = show_context

    def success(self, result: CommandResult) -> None:
        """Display successful command result with suggestions for next steps."""

        # Main success message with emoji and styling
        self.console.print(f"✅ {result.message}", style="bold green")

        # Show context information with resource IDs
        if self.show_context and result.context:
            self.console.print("\n📋 Available Resources:", style="bold blue")
            for key, value in result.context.items():
                # Format different types of values appropriately
                if isinstance(value, str) and len(value) > 50:
                    display_value = f"{value[:47]}..."
                else:
                    display_value = str(value)
                self.console.print(f"  • {key}: [cyan]{display_value}[/cyan]")

        # Show structured data if available
        if result.data:
            self._render_data(result.data, result.command_type)

        # Show suggested next actions
        if self.show_suggestions and result.suggestions:
            self._render_suggestions(result.suggestions)

        # Add spacing for readability
        self.console.print()

    def error(self, result: CommandResult) -> None:
        """Display error with three-part pattern:
        what went wrong, how to fix, what's next."""

        if not result.error:
            self.console.print(f"❌ {result.message}", style="bold red")
            return

        error = result.error

        # What went wrong
        self.console.print("❌ Command failed", style="bold red")
        self.console.print(f"   {result.message}")

        self.console.print("\n🔍 What went wrong:", style="bold yellow")
        self.console.print(f"  {error.what_went_wrong}")

        # How to fix it
        if error.how_to_fix:
            self.console.print("\n🔧 How to fix:", style="bold green")
            for i, fix_step in enumerate(error.how_to_fix, 1):
                self.console.print(f"  {i}. {fix_step}")

        # What's next
        if error.whats_next:
            self.console.print("\n💡 What's next:", style="bold blue")
            for suggestion in error.whats_next:
                self.console.print(
                    f"  • [cyan]{suggestion.command}[/cyan]"
                    f" - {suggestion.description}"
                )

        self.console.print()

    def _render_data(self, data: list[Any], command_type: str) -> None:
        """Render structured data based on command type."""

        if not data:
            return

        self.console.print("\n📊 Results:", style="bold blue")

        # For document listings
        if command_type in ["document_list", "document_details"]:
            table = Table(show_header=True, header_style="bold magenta")
            table.add_column("Name", style="cyan", no_wrap=False)
            table.add_column("ID", style="yellow", no_wrap=True)
            table.add_column("Updated", style="green", no_wrap=True)

            for item in data[:10]:  # Limit to first 10 for readability
                if hasattr(item, "name"):  # Pydantic model
                    name = (
                        item.name[:40] + "..." if len(item.name) > 40 else item.name
                    )
                    doc_id = item.id
                    updated = (
                        item.updated_at.strftime("%Y-%m-%d")
                        if item.updated_at
                        else "Unknown"
                    )
                else:  # Dictionary
                    name = item.get("name", "Unknown")[:40]
                    doc_id = item.get("id", "Unknown")
                    updated = item.get("updated_at", "Unknown")

                table.add_row(name, doc_id, updated)

            self.console.print(table)

            if len(data) > 10:
                self.console.print(f"  ... and {len(data) - 10} more documents")

        # For table listings
        elif command_type in ["table_list", "table_data"]:
            table = Table(show_header=True, header_style="bold magenta")

            if data and isinstance(data[0], dict):
                # Dynamic table based on data keys
                if len(data[0]) <= 5:  # Show all columns if few
                    for key in data[0]:
                        table.add_column(
                            str(key).replace("_", " ").title(), no_wrap=False
                        )

                    for item in data[:10]:
                        table.add_row(
                            *[
                                str(v)[:30] + "..." if len(str(v)) > 30 else str(v)
                                for v in item.values()
                            ]
                        )
                else:
                    # Show first few columns if many
                    keys = list(data[0])[:4]
                    for key in keys:
                        table.add_column(
                            str(key).replace("_", " ").title(), no_wrap=False
                        )

                    for item in data[:10]:
                        row_data = [
                            (
                                str(item.get(k, ""))[:20] + "..."
                                if len(str(item.get(k, ""))) > 20
                                else str(item.get(k, ""))
                            )
                            for k in keys
                        ]
                        table.add_row(*row_data)

                self.console.print(table)

                if len(data) > 10:
                    self.console.print(f"  ... and {len(data) - 10} more rows")
            else:
                # Handle other data types
                table.add_column("Item", style="cyan")
                for item in data[:10]:
                    table.add_row(str(item))
                self.console.print(table)

    def _render_suggestions(self, suggestions: list[Suggestion]) -> None:
        """Render suggested next commands."""

        self.console.print(
            "\n💡 What's next? Try these commands:", style="bold yellow"
        )

        for i, suggestion in enumerate(suggestions[:5], 1):  # Limit to 5 suggestions
            category_emoji = self._get_category_emoji(suggestion.category)
            self.console.print(
                f"  {i}. {category_emoji}[bold cyan]{suggestion.command}"
                f"[/bold cyan] - {suggestion.description}"
            )

    def _get_category_emoji(self, category: Optional[str]) -> str:
        """Get emoji for suggestion category."""
        emoji_map = {
            "view": "👁️ ",
            "export": "📤 ",
            "search": "🔍 ",
            "create": "✨ ",
            "edit": "✏️ ",
            "delete": "🗑️ ",
            "auth": "🔐 ",
            "config": "⚙️ ",
        }
        return emoji_map.get(category, "")

    def skill_snippet(self, operation_type: str, context: dict[str, Any]) -> None:
        """Generate Claude skill compatible code snippet."""

        if not self.show_context:
            return

        self.console.print("\n🤖 For AI agents/Claude skills:", style="bold magenta")

        if operation_type == "document_list":
            query = context.get("query", "")
            code = f'''```bash
python3 -c "
from codaio import Coda
coda = Coda.from_environment()
for doc in coda.list_docs(query='{query}'):
    print(f\\"{{doc['name']}} (ID: {{doc['id']}})\\")"
"
```'''

        elif operation_type == "table_export":
            doc_id = context.get("doc_id", "YOUR_DOC_ID")
            table_name = context.get("table_name", "TABLE_NAME")
            code = f'''```bash
python3 -c "
from codaio import Document
doc = Document.from_environment('{doc_id}')
table = doc.get_table('{table_name}')
for row in table.rows():
    print(row.to_dict())
"
```'''

        elif operation_type == "document_tables":
            doc_id = context.get("doc_id", "YOUR_DOC_ID")
            code = f'''```bash
python3 -c "
from codaio import Document
doc = Document.from_environment('{doc_id}')
for table in doc.list_tables():
    print(f\\"{{table.name}} (ID: {{table.id}})\\")"
"
```'''
        else:
            # Generic fallback
            code = '''```bash
python3 -c "
from codaio import Coda
coda = Coda.from_environment()
docs = coda.list_docs()
print(f'Found {len(docs)} documents')
"
```'''

        panel = Panel(
            code, title="Claude Skill Compatible Code", border_style="blue"
        )
        self.console.print(panel)

    def json_export(self, data: Any, pretty: bool = True) -> str:
        """Export data as JSON string."""
        if pretty:
            return json.dumps(data, indent=2, default=str)
        return json.dumps(data, default=str)

    def table_export(
        self, data: list[dict[str, Any]], title: str = "Data"
    ) -> Table:
        """Create a Rich table for export/display."""
        table = Table(title=title, show_header=True, header_style="bold magenta")

        if not data:
            table.add_column("No Data", style="dim")
            table.add_row("No results found")
            return table

        # Add columns based on first row keys
        for key in data[0]:
            column_name = str(key).replace("_", " ").title()
            table.add_column(column_name, no_wrap=False)

        # Add rows
        for row in data:
            table.add_row(*[str(v) for v in row.values()])

        return table

    def info(
        self, message: str, details: Optional[dict[str, Any]] = None
    ) -> None:
        """Display informational message."""
        self.console.print(f"ℹ️  {message}", style="bold blue")

        if details:
            for key, value in details.items():
                self.console.print(f"   {key}: [cyan]{value}[/cyan]")

        self.console.print()

    def warning(
        self, message: str, suggestions: Optional[list[Suggestion]] = None
    ) -> None:
        """Display warning message with optional suggestions."""
        self.console.print(f"⚠️  {message}", style="bold yellow")

        if suggestions:
            self.console.print("\n💡 Consider these options:", style="yellow")
            for suggestion in suggestions:
                self.console.print(
                    f"  • [cyan]{suggestion.command}[/cyan]"
                    f" - {suggestion.description}"
                )

        self.console.print()