"""Data models for Coda CLI."""

from .responses import (
    CommandResult,
    DocumentInfo,
    TableInfo,
    Suggestion,
    ErrorDetail,
)
from .config import (
    ConfigModel,
    AuthConfig,
    OutputConfig,
)

__all__ = [
    "CommandResult",
    "DocumentInfo",
    "TableInfo",
    "Suggestion",
    "ErrorDetail",
    "ConfigModel",
    "AuthConfig",
    "OutputConfig",
]
