"""Pydantic models for CLI command responses."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field


class CommandType(str, Enum):
    """Types of CLI commands for context-aware suggestions."""
    DOCUMENT_LIST = "document_list"
    DOCUMENT_DETAILS = "document_details"
    TABLE_LIST = "table_list"
    TABLE_DATA = "table_data"
    EXPORT = "export"
    AUTH_TEST = "auth_test"
    AUTH_SETUP = "auth_setup"


class Suggestion(BaseModel):
    """A suggested next command with description."""
    command: str = Field(..., description="The exact command to run")
    description: str = Field(..., description="Human-readable description of what the command does")
    category: Optional[str] = Field(None, description="Category of suggestion (view, export, search, etc.)")


class ErrorDetail(BaseModel):
    """Detailed error information following 'what went wrong, how to fix, what's next' pattern."""
    what_went_wrong: str = Field(..., description="Clear explanation of the failure")
    how_to_fix: List[str] = Field(..., description="Step-by-step instructions to resolve")
    whats_next: List[Suggestion] = Field(..., description="Suggested commands to try after fixing")
    error_code: Optional[str] = Field(None, description="Machine-readable error code")


class DocumentInfo(BaseModel):
    """Information about a Coda document."""
    id: str = Field(..., description="Document ID")
    name: str = Field(..., description="Document name")
    href: str = Field(..., description="API href")
    browser_link: Optional[str] = Field(None, description="Web browser URL")
    created_at: Optional[datetime] = Field(None, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    owner: Optional[str] = Field(None, description="Document owner")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class TableInfo(BaseModel):
    """Information about a Coda table."""
    id: str = Field(..., description="Table ID")
    name: str = Field(..., description="Table name")
    href: str = Field(..., description="API href")
    browser_link: Optional[str] = Field(None, description="Web browser URL")
    row_count: Optional[int] = Field(None, description="Number of rows")
    column_count: Optional[int] = Field(None, description="Number of columns")
    parent_doc_id: str = Field(..., description="Parent document ID")


class CommandResult(BaseModel):
    """Result of a CLI command with conversational context."""
    command_type: CommandType = Field(..., description="Type of command executed")
    success: bool = Field(..., description="Whether the command succeeded")
    message: str = Field(..., description="Primary result message")
    
    # Success context
    context: Dict[str, Any] = Field(default_factory=dict, description="Resource IDs and metadata")
    data: Optional[Union[List[DocumentInfo], List[TableInfo], List[Dict[str, Any]]]] = Field(
        None, description="Structured data results"
    )
    suggestions: List[Suggestion] = Field(default_factory=list, description="Suggested next commands")
    
    # Error context  
    error: Optional[ErrorDetail] = Field(None, description="Detailed error information")
    
    # Metadata
    timestamp: datetime = Field(default_factory=datetime.now, description="Command execution time")
    execution_time_ms: Optional[int] = Field(None, description="Command execution time in milliseconds")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ExportResult(BaseModel):
    """Result of a data export operation."""
    format: str = Field(..., description="Export format (json, csv, excel, etc.)")
    file_path: Optional[str] = Field(None, description="Path to exported file")
    row_count: int = Field(..., description="Number of rows exported")
    column_count: int = Field(..., description="Number of columns exported")
    size_bytes: Optional[int] = Field(None, description="File size in bytes")
    doc_id: str = Field(..., description="Source document ID")
    table_id: str = Field(..., description="Source table ID")
    table_name: str = Field(..., description="Source table name")
