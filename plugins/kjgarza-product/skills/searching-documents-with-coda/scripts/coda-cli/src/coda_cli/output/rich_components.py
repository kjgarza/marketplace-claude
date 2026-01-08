"""Rich UI components for consistent formatting across commands."""

from typing import Any, Optional

from rich.console import Console
from rich.progress import Progress
from rich.prompt import Confirm, Prompt
from rich.status import Status
from rich.table import Table


class RichComponents:
    """Reusable Rich components for consistent UI across commands."""

    def __init__(self, console: Console):
        self.console = console

    def create_document_table(self, documents: list[dict[str, Any]]) -> Table:
        """Create a formatted table for document listings."""
        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Name", style="cyan", no_wrap=False, min_width=30)
        table.add_column("ID", style="yellow", no_wrap=True, min_width=12)
        table.add_column("Owner", style="green", no_wrap=True, min_width=15)
        table.add_column("Updated", style="blue", no_wrap=True, min_width=10)

        for doc in documents:
            name = doc.get("name", "Unknown")
            # Truncate long names
            display_name = name[:50] + "..." if len(name) > 50 else name

            doc_id = doc.get("id", "Unknown")
            owner = doc.get("owner", {}).get("name", "Unknown")
            if len(owner) > 15:
                owner = owner[:12] + "..."

            updated = doc.get("updatedAt", "Unknown")
            if updated != "Unknown" and "T" in updated:
                updated = updated.split("T")[0]  # Just date part

            table.add_row(display_name, doc_id, owner, updated)

        return table

    def create_table_table(self, tables: list[dict[str, Any]]) -> Table:
        """Create a formatted table for table listings."""
        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Name", style="cyan", no_wrap=False, min_width=25)
        table.add_column("ID", style="yellow", no_wrap=True, min_width=12)
        table.add_column("Rows", style="green", no_wrap=True, min_width=8)
        table.add_column("Columns", style="blue", no_wrap=True, min_width=8)

        for tbl in tables:
            name = tbl.get("name", "Unknown")
            display_name = name[:40] + "..." if len(name) > 40 else name

            table_id = tbl.get("id", "Unknown")
            row_count = str(tbl.get("rowCount", "?"))
            col_count = str(len(tbl.get("columns", [])))

            table.add_row(display_name, table_id, row_count, col_count)

        return table

    def create_status_context(self, message: str) -> Status:
        """Create a status spinner with consistent styling."""
        return Status(message, console=self.console, spinner="dots")

    def create_progress_context(self) -> Progress:
        """Create a progress bar with consistent styling."""
        return Progress(console=self.console)

    def prompt_confirmation(self, message: str, default: bool = True) -> bool:
        """Prompt for user confirmation with consistent styling."""
        return Confirm.ask(message, default=default, console=self.console)

    def prompt_input(
        self,
        message: str,
        password: bool = False,
        default: Optional[str] = None,
    ) -> str:
        """Prompt for user input with consistent styling."""
        return Prompt.ask(
            message, password=password, default=default, console=self.console
        )

    def display_api_key_preview(self, api_key: str) -> str:
        """Create a safe preview of an API key."""
        if len(api_key) < 12:
            return f"{api_key[:4]}***"
        return f"{api_key[:8]}...{api_key[-4:]}"

    def create_error_panel_content(self, error: Exception) -> str:
        """Create formatted error content for panels."""
        error_type = type(error).__name__
        return f"[bold red]{error_type}[/bold red]\n\n{str(error)}"

    def create_data_preview_table(
        self, data: list[dict[str, Any]], max_rows: int = 5
    ) -> Table:
        """Create a preview table for data with limited rows."""
        if not data:
            table = Table(show_header=True, header_style="bold magenta")
            table.add_column("No Data", style="dim")
            table.add_row("No results to preview")
            return table

        table = Table(show_header=True, header_style="bold magenta")

        # Add columns (limit to reasonable number)
        keys = list(data[0].keys())[:6]  # Max 6 columns for readability
        for key in keys:
            column_name = str(key).replace("_", " ").title()
            table.add_column(column_name, no_wrap=False, min_width=10)

        # Add rows (limited)
        for row in data[:max_rows]:
            row_values = []
            for key in keys:
                value = str(row.get(key, ""))
                # Truncate long values
                if len(value) > 20:
                    value = value[:17] + "..."
                row_values.append(value)
            table.add_row(*row_values)

        return table

    def format_export_summary(
        self,
        format_type: str,
        row_count: int,
        file_path: Optional[str] = None,
        file_size: Optional[int] = None,
    ) -> dict[str, str]:
        """Format export operation summary for display."""
        summary = {
            "Format": format_type.upper(),
            "Rows exported": str(row_count),
        }

        if file_path:
            summary["File saved"] = file_path

        if file_size:
            if file_size < 1024:
                size_str = f"{file_size} bytes"
            elif file_size < 1024 * 1024:
                size_str = f"{file_size / 1024:.1f} KB"
            else:
                size_str = f"{file_size / (1024 * 1024):.1f} MB"
            summary["File size"] = size_str

        return summary