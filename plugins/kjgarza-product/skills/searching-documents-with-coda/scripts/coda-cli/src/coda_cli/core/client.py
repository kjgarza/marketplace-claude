"""Enhanced Coda API client with AI-friendly error handling and response formatting."""

import os
from datetime import datetime
from typing import Optional

from codaio import Coda, Document
from codaio.err import CodaError

from .config import Config
from ..models.responses import (
    CommandResult,
    CommandType,
    DocumentInfo,
    ErrorDetail,
    Suggestion,
    TableInfo,
)


class CodaClientError(Exception):
    """Custom exception for Coda client errors."""

    def __init__(self, message: str, error_code: str = "UNKNOWN"):
        self.message = message
        self.error_code = error_code
        super().__init__(message)


class CodaClient:
    """Enhanced Coda client with conversational error handling."""

    def __init__(
        self,
        config: Optional[Config] = None,
        api_key: Optional[str] = None,
    ):
        self.config = config or Config()

        # Determine API key source
        self.api_key = (
            api_key or self.config.get_api_key() or os.getenv("CODA_API_KEY")
        )

        if not self.api_key:
            raise CodaClientError(
                "No API key found. Set CODA_API_KEY environment variable "
                "or use 'coda auth setup'",
                "NO_API_KEY",
            )

        try:
            self.coda = Coda(self.api_key)
        except Exception as e:
            raise CodaClientError(
                f"Failed to initialize Coda client: {e}", "INIT_ERROR"
            ) from e

    def test_authentication(self) -> CommandResult:
        """Test API authentication and return conversational result."""
        try:
            account_info = self.coda.account()
            
            return CommandResult(
                command_type=CommandType.AUTH_TEST,
                success=True,
                message="Authentication successful!",
                context={
                    "Account name": account_info.get("name", "Unknown"),
                    "Account email": account_info.get("email", "Unknown"),
                    "API endpoint": self.config.config.auth.api_endpoint,
                },
                suggestions=[
                    Suggestion(
                        command="coda docs list",
                        description="List your accessible documents",
                        category="view"
                    ),
                    Suggestion(
                        command="coda docs search 'PRD'",
                        description="Search for Product Requirements Documents",
                        category="search"
                    ),
                    Suggestion(
                        command="coda docs list --mine",
                        description="List only documents you own",
                        category="view"
                    ),
                ],
            )
            
        except CodaError as e:
            return self._handle_auth_error(e)
        except Exception as e:
            return self._handle_generic_error(e, "authentication test")

    def list_documents(
        self,
        query: Optional[str] = None,
        owner_only: bool = False,
        limit: Optional[int] = None,
    ) -> CommandResult:
        """List documents with conversational response."""
        try:
            # Call Coda API
            result = self.coda.list_docs(
                query=query,
                is_owner=owner_only,
                limit=limit
            )

            # Handle response format - list_docs returns {'items': [...], 'href': ...}
            docs = result.get('items', []) if isinstance(result, dict) else result

            # Convert to our models
            doc_list = []
            for doc in docs:
                # Handle owner field - can be string (email) or dict with 'name'
                owner = doc.get("owner")
                if isinstance(owner, dict):
                    owner_name = owner.get("name")
                else:
                    owner_name = doc.get("ownerName") or owner

                doc_info = DocumentInfo(
                    id=doc["id"],
                    name=doc["name"],
                    href=doc["href"],
                    browser_link=doc.get("browserLink"),
                    created_at=self._parse_datetime(doc.get("createdAt")),
                    updated_at=self._parse_datetime(doc.get("updatedAt")),
                    owner=owner_name,
                )
                doc_list.append(doc_info)
            
            # Generate contextual suggestions
            suggestions = self._generate_document_list_suggestions(doc_list, query, owner_only)
            
            # Create context info
            context = {
                "Total documents": len(doc_list),
                "Query used": query or "None",
                "Owner filter": "Yes" if owner_only else "No",
            }
            
            if doc_list:
                first_doc = doc_list[0]
                context["First document ID"] = first_doc.id
                context["First document name"] = first_doc.name
            
            message = f"Found {len(doc_list)} documents"
            if query:
                message += f" matching '{query}'"
            if owner_only:
                message += " (owned by you)"
            
            return CommandResult(
                command_type=CommandType.DOCUMENT_LIST,
                success=True,
                message=message,
                context=context,
                data=doc_list,
                suggestions=suggestions,
            )
            
        except CodaError as e:
            return self._handle_coda_error(e, "document listing")
        except Exception as e:
            return self._handle_generic_error(e, "document listing")

    def get_document(self, doc_id: str) -> CommandResult:
        """Get document details with conversational response."""
        try:
            doc_info = self.coda.get_doc(doc_id)

            # Handle owner field - can be string (email) or dict with 'name'
            owner = doc_info.get("owner")
            if isinstance(owner, dict):
                owner_name = owner.get("name")
            else:
                owner_name = doc_info.get("ownerName") or owner

            doc = DocumentInfo(
                id=doc_info["id"],
                name=doc_info["name"],
                href=doc_info["href"],
                browser_link=doc_info.get("browserLink"),
                created_at=self._parse_datetime(doc_info.get("createdAt")),
                updated_at=self._parse_datetime(doc_info.get("updatedAt")),
                owner=owner_name,
            )
            
            suggestions = [
                Suggestion(
                    command=f"coda tables list {doc_id}",
                    description="List tables in this document",
                    category="view"
                ),
                Suggestion(
                    command=f"coda export {doc_id} --all",
                    description="Export all data from this document",
                    category="export"
                ),
                Suggestion(
                    command=doc.browser_link or f"https://coda.io/d/_d{doc_id}",
                    description="Open document in browser",
                    category="view"
                ),
            ]
            
            context = {
                "Document ID": doc.id,
                "Document name": doc.name,
                "Owner": doc.owner or "Unknown",
                "Created": doc.created_at.strftime("%Y-%m-%d") if doc.created_at else "Unknown",
                "Updated": doc.updated_at.strftime("%Y-%m-%d") if doc.updated_at else "Unknown",
                "Browser URL": doc.browser_link or f"https://coda.io/d/_d{doc_id}",
            }
            
            return CommandResult(
                command_type=CommandType.DOCUMENT_DETAILS,
                success=True,
                message=f"Document details for '{doc.name}'",
                context=context,
                data=[doc],
                suggestions=suggestions,
            )
            
        except CodaError as e:
            if "not found" in str(e).lower():
                return self._handle_not_found_error("document", doc_id)
            return self._handle_coda_error(e, "document retrieval")
        except Exception as e:
            return self._handle_generic_error(e, "document retrieval")

    def list_tables(self, doc_id: str) -> CommandResult:
        """List tables in a document with conversational response."""
        try:
            doc = Document(doc_id, coda=self.coda)
            tables = doc.list_tables()
            
            # Convert to our models
            table_list = []
            for table in tables:
                # Handle columns - it's a method, not a property
                try:
                    columns = table.columns() if callable(getattr(table, 'columns', None)) else []
                    column_count = len(columns)
                except Exception:
                    column_count = 0

                table_info = TableInfo(
                    id=table.id,
                    name=table.name,
                    href=table.href,
                    browser_link=getattr(table, 'browser_link', None),
                    row_count=getattr(table, 'row_count', None),
                    column_count=column_count,
                    parent_doc_id=doc_id,
                )
                table_list.append(table_info)
            
            suggestions = self._generate_table_list_suggestions(table_list, doc_id)
            
            context = {
                "Document ID": doc_id,
                "Total tables": len(table_list),
            }
            
            if table_list:
                first_table = table_list[0]
                context["First table ID"] = first_table.id
                context["First table name"] = first_table.name
            
            return CommandResult(
                command_type=CommandType.TABLE_LIST,
                success=True,
                message=f"Found {len(table_list)} tables in document",
                context=context,
                data=table_list,
                suggestions=suggestions,
            )
            
        except CodaError as e:
            if "not found" in str(e).lower():
                return self._handle_not_found_error("document", doc_id)
            return self._handle_coda_error(e, "table listing")
        except Exception as e:
            return self._handle_generic_error(e, "table listing")

    def get_table_data(self, doc_id: str, table_id: str) -> CommandResult:
        """Get table data with conversational response."""
        try:
            doc = Document(doc_id, coda=self.coda)
            table = doc.get_table(table_id)
            
            # Get all rows as dictionaries
            rows = [row.to_dict() for row in table.rows()]
            
            suggestions = [
                Suggestion(
                    command=f"coda export {doc_id} {table_id} --format json",
                    description="Export this table as JSON",
                    category="export"
                ),
                Suggestion(
                    command=f"coda export {doc_id} {table_id} --format csv",
                    description="Export this table as CSV",
                    category="export"
                ),
                Suggestion(
                    command=f"coda table show {doc_id} {table_id}",
                    description="View table schema and details",
                    category="view"
                ),
            ]
            
            context = {
                "Document ID": doc_id,
                "Table ID": table_id,
                "Table name": table.name,
                "Total rows": len(rows),
                "Total columns": len(rows[0]) if rows else 0,
            }
            
            return CommandResult(
                command_type=CommandType.TABLE_DATA,
                success=True,
                message=f"Retrieved {len(rows)} rows from table '{table.name}'",
                context=context,
                data=rows,
                suggestions=suggestions,
            )
            
        except CodaError as e:
            if "not found" in str(e).lower():
                return self._handle_not_found_error("table", table_id)
            return self._handle_coda_error(e, "table data retrieval")
        except Exception as e:
            return self._handle_generic_error(e, "table data retrieval")

    def _parse_datetime(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse datetime string from Coda API."""
        if not date_str:
            return None
        try:
            # Handle ISO format with timezone
            if date_str.endswith('Z'):
                return datetime.fromisoformat(date_str[:-1])
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except ValueError:
            return None

    def _generate_document_list_suggestions(
        self, 
        docs: list[DocumentInfo], 
        query: Optional[str], 
        owner_only: bool
    ) -> list[Suggestion]:
        """Generate contextual suggestions for document listing."""
        suggestions = []
        
        if docs:
            first_doc = docs[0]
            suggestions.extend([
                Suggestion(
                    command=f"coda docs show {first_doc.id}",
                    description=f"View details for '{first_doc.name}'",
                    category="view"
                ),
                Suggestion(
                    command=f"coda tables list {first_doc.id}",
                    description=f"List tables in '{first_doc.name}'",
                    category="view"
                ),
            ])
        
        if not query:
            suggestions.append(
                Suggestion(
                    command="coda docs search 'PRD'",
                    description="Search for Product Requirements Documents",
                    category="search"
                )
            )
        
        if not owner_only:
            suggestions.append(
                Suggestion(
                    command="coda docs list --mine",
                    description="Show only documents you own",
                    category="search"
                )
            )
        
        return suggestions

    def _generate_table_list_suggestions(
        self, tables: list[TableInfo], doc_id: str
    ) -> list[Suggestion]:
        """Generate contextual suggestions for table listing."""
        suggestions = []
        
        if tables:
            first_table = tables[0]
            suggestions.extend([
                Suggestion(
                    command=f"coda export {doc_id} {first_table.id} --format json",
                    description=f"Export '{first_table.name}' as JSON",
                    category="export"
                ),
                Suggestion(
                    command=f"coda table show {doc_id} {first_table.id}",
                    description=f"View '{first_table.name}' data",
                    category="view"
                ),
            ])
        
        suggestions.extend([
            Suggestion(
                command=f"coda docs show {doc_id}",
                description="View parent document details",
                category="view"
            ),
            Suggestion(
                command=f"coda export {doc_id} --all",
                description="Export all tables from this document",
                category="export"
            ),
        ])
        
        return suggestions

    def _handle_auth_error(self, error: CodaError) -> CommandResult:
        """Handle authentication-specific errors."""
        return CommandResult(
            command_type=CommandType.AUTH_TEST,
            success=False,
            message="Authentication failed",
            error=ErrorDetail(
                what_went_wrong="Your API key is missing, invalid, or expired",
                how_to_fix=[
                    "Check if CODA_API_KEY environment variable is set",
                    "Verify your API key is correct",
                    "Get a new API key from https://coda.io/account",
                ],
                whats_next=[
                    Suggestion(
                        command="coda auth setup",
                        description="Interactive authentication setup",
                        category="auth"
                    ),
                    Suggestion(
                        command="echo $CODA_API_KEY",
                        description="Check if API key is set",
                        category="auth"
                    ),
                ],
                error_code="AUTH_FAILED",
            ),
        )

    def _handle_not_found_error(self, resource_type: str, resource_id: str) -> CommandResult:
        """Handle resource not found errors."""
        suggestions = []
        
        if resource_type == "document":
            suggestions = [
                Suggestion(
                    command="coda docs list",
                    description="List all accessible documents",
                    category="view"
                ),
                Suggestion(
                    command="coda docs search 'keyword'",
                    description="Search for documents by name/content",
                    category="search"
                ),
            ]
        elif resource_type == "table":
            suggestions = [
                Suggestion(
                    command="coda tables list <doc-id>",
                    description="List tables in a document",
                    category="view"
                ),
            ]
        
        return CommandResult(
            command_type=CommandType.DOCUMENT_DETAILS if resource_type == "document" else CommandType.TABLE_DATA,
            success=False,
            message=f"{resource_type.title()} '{resource_id}' not found",
            error=ErrorDetail(
                what_went_wrong=f"The {resource_type} ID might be incorrect or you don't have access",
                how_to_fix=[
                    "Verify the ID is correct",
                    "Check if you have access permissions",
                    f"Try listing available {resource_type}s",
                ],
                whats_next=suggestions,
                error_code="NOT_FOUND",
            ),
        )

    def _handle_coda_error(self, error: CodaError, operation: str) -> CommandResult:
        """Handle general Coda API errors."""
        return CommandResult(
            command_type=CommandType.DOCUMENT_LIST,  # Generic fallback
            success=False,
            message=f"Coda API error during {operation}",
            error=ErrorDetail(
                what_went_wrong=f"The Coda API returned an error: {str(error)}",
                how_to_fix=[
                    "Check your internet connection",
                    "Verify your API permissions",
                    "Try the operation again in a moment",
                ],
                whats_next=[
                    Suggestion(
                        command="coda auth test",
                        description="Test your authentication",
                        category="auth"
                    ),
                ],
                error_code="CODA_API_ERROR",
            ),
        )

    def _handle_generic_error(self, error: Exception, operation: str) -> CommandResult:
        """Handle unexpected errors."""
        return CommandResult(
            command_type=CommandType.DOCUMENT_LIST,  # Generic fallback
            success=False,
            message=f"Unexpected error during {operation}",
            error=ErrorDetail(
                what_went_wrong=f"An unexpected error occurred: {str(error)}",
                how_to_fix=[
                    "Check your input parameters",
                    "Ensure all required arguments are provided",
                    "Try the operation again",
                ],
                whats_next=[
                    Suggestion(
                        command="coda auth test",
                        description="Test your authentication",
                        category="auth"
                    ),
                ],
                error_code="GENERIC_ERROR",
            ),
        )