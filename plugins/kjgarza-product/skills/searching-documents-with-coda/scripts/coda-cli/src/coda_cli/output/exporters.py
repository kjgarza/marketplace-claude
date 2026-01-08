"""Data export functionality with multiple format support."""

import csv
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from ..models.responses import ExportResult


class DataExporter:
    """Handle data export in multiple formats with consistent naming."""

    def __init__(self, output_dir: Optional[Path] = None):
        self.output_dir = output_dir or Path.cwd()

    def export_json(
        self,
        data: list[dict[str, Any]],
        filename: Optional[str] = None,
        pretty: bool = True,
    ) -> ExportResult:
        """Export data as JSON file."""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"coda_export_{timestamp}.json"

        file_path = self.output_dir / filename

        # Convert data to JSON
        json_data = data if isinstance(data, list) else [data]

        with open(file_path, "w", encoding="utf-8") as f:
            if pretty:
                json.dump(json_data, f, indent=2, default=str, ensure_ascii=False)
            else:
                json.dump(json_data, f, default=str, ensure_ascii=False)

        return ExportResult(
            format="json",
            file_path=str(file_path),
            row_count=len(json_data),
            column_count=len(json_data[0]) if json_data else 0,
            size_bytes=file_path.stat().st_size,
            doc_id="",  # Will be filled by caller
            table_id="",  # Will be filled by caller
            table_name="",  # Will be filled by caller
        )

    def export_csv(
        self,
        data: list[dict[str, Any]],
        filename: Optional[str] = None,
    ) -> ExportResult:
        """Export data as CSV file."""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"coda_export_{timestamp}.csv"

        file_path = self.output_dir / filename

        if not data:
            # Create empty CSV
            with open(file_path, "w", encoding="utf-8") as f:
                f.write("# No data to export\n")
            return ExportResult(
                format="csv",
                file_path=str(file_path),
                row_count=0,
                column_count=0,
                size_bytes=file_path.stat().st_size,
                doc_id="",
                table_id="",
                table_name="",
            )

        # Write CSV with proper headers
        with open(file_path, "w", encoding="utf-8", newline="") as f:
            fieldnames = data[0].keys()
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)

        return ExportResult(
            format="csv",
            file_path=str(file_path),
            row_count=len(data),
            column_count=len(data[0]) if data else 0,
            size_bytes=file_path.stat().st_size,
            doc_id="",
            table_id="",
            table_name="",
        )

    def export_skill_bash(
        self,
        operation_type: str,
        context: dict[str, Any],
        filename: Optional[str] = None,
    ) -> ExportResult:
        """Export as Claude skill compatible bash script."""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"coda_skill_{timestamp}.sh"

        file_path = self.output_dir / filename

        # Generate appropriate bash script
        script_content = self._generate_skill_script(operation_type, context)

        with open(file_path, "w", encoding="utf-8") as f:
            f.write("#!/bin/bash\n")
            f.write(f"# Generated Coda skill script - {datetime.now().isoformat()}\n")
            f.write("# Compatible with .claude/skills/coda/ patterns\n\n")
            f.write("# Ensure CODA_API_KEY is set\n")
            f.write('if [ -z "$CODA_API_KEY" ]; then\n')
            f.write('    echo "Error: CODA_API_KEY environment variable not set"\n')
            f.write('    exit 1\nfi\n\n')
            f.write(script_content)

        # Make executable
        file_path.chmod(0o755)

        return ExportResult(
            format="skill-bash",
            file_path=str(file_path),
            row_count=1,  # One script
            column_count=1,
            size_bytes=file_path.stat().st_size,
            doc_id=context.get("doc_id", ""),
            table_id=context.get("table_id", ""),
            table_name=context.get("table_name", ""),
        )

    def _generate_skill_script(
        self, operation_type: str, context: dict[str, Any]
    ) -> str:
        """Generate bash script content based on operation type."""

        if operation_type == "document_list":
            query = context.get("query", "")
            return f'''# List Coda documents with query: "{query}"
python3 -c "
from codaio import Coda
coda = Coda.from_environment()
docs = coda.list_docs(query='{query}')
for doc in docs:
    print(f\\"{{doc['name']}} (ID: {{doc['id']}})\\")"
"
'''

        elif operation_type == "table_export":
            doc_id = context.get("doc_id", "YOUR_DOC_ID")
            table_name = context.get("table_name", "TABLE_NAME")
            return f'''# Export table data from document {doc_id}
python3 -c "
from codaio import Document
import json

doc = Document.from_environment('{doc_id}')
table = doc.get_table('{table_name}')
rows = [row.to_dict() for row in table.rows()]

print(json.dumps(rows, indent=2, default=str))
"
'''

        elif operation_type == "document_tables":
            doc_id = context.get("doc_id", "YOUR_DOC_ID")
            return f'''# List tables in document {doc_id}
python3 -c "
from codaio import Document
doc = Document.from_environment('{doc_id}')
tables = doc.list_tables()
for table in tables:
    print(f\\"{{table.name}} (ID: {{table.id}})\\")"
"
'''

        elif operation_type == "search_documents":
            query = context.get("query", "")
            return f'''# Search documents for: "{query}"
python3 -c "
from codaio import Coda
coda = Coda.from_environment()
docs = coda.list_docs(query='{query}')
print(f'Found {{len(docs)}} documents matching \\"{query}\\"')
for doc in docs:
    print(f\\"- {{doc['name']}} ({{doc['id']}})\\")"
"
'''

        else:
            # Generic fallback
            return '''# Generic Coda operation
python3 -c "
from codaio import Coda
coda = Coda.from_environment()
account = coda.account()
docs = coda.list_docs(limit=5)
print(f\\"Account: {{account.get('name', 'Unknown')}}\\")
print(f\\"Recent documents: {{len(docs)}}\\"")
"
'''

    def get_supported_formats(self) -> list[str]:
        """Get list of supported export formats."""
        return ["json", "csv", "skill-bash"]

    def create_filename(
        self, base_name: str, format_type: str, timestamp: bool = True
    ) -> str:
        """Create a standardized filename."""
        # Clean base name
        safe_name = "".join(c for c in base_name if c.isalnum() or c in "-_")[:30]

        if timestamp:
            time_str = datetime.now().strftime("%Y%m%d_%H%M%S")
            return f"{safe_name}_{time_str}.{format_type}"
        else:
            return f"{safe_name}.{format_type}"