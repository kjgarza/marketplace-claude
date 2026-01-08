"""Configuration models for Coda CLI."""

from enum import Enum
from pathlib import Path
from typing import Optional

from pydantic import BaseModel, Field, validator


class OutputFormat(str, Enum):
    """Supported output formats."""
    CONVERSATIONAL = "conversational"
    JSON = "json"
    CSV = "csv"
    TABLE = "table"
    SKILL_COMPATIBLE = "skill-compatible"


class LogLevel(str, Enum):
    """Logging levels."""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"


class AuthConfig(BaseModel):
    """Authentication configuration."""
    api_key: Optional[str] = Field(None, description="Coda API key")
    api_endpoint: str = Field(
        "https://coda.io/apis/v1", 
        description="Coda API endpoint"
    )
    timeout: int = Field(30, description="Request timeout in seconds")
    
    @validator('api_key')
    def validate_api_key(cls, v):
        if v and len(v) < 10:
            raise ValueError('API key seems too short')
        return v


class OutputConfig(BaseModel):
    """Output formatting configuration."""
    format: OutputFormat = Field(
        OutputFormat.CONVERSATIONAL, 
        description="Default output format"
    )
    show_suggestions: bool = Field(True, description="Show command suggestions")
    show_context_ids: bool = Field(True, description="Include resource IDs in output")
    show_timestamps: bool = Field(False, description="Include timestamps in output")
    max_suggestions: int = Field(5, description="Maximum number of suggestions to show")
    table_max_rows: int = Field(50, description="Maximum rows to display in terminal tables")
    

class IntegrationConfig(BaseModel):
    """Integration with existing tools."""
    claude_skills: bool = Field(True, description="Generate Claude skill compatible code")
    skill_snippets: bool = Field(True, description="Show skill code snippets")
    export_formats: list[str] = Field(
        default_factory=lambda: ['json', 'csv', 'skill-bash'],
        description="Available export formats"
    )


class ConfigModel(BaseModel):
    """Complete CLI configuration."""
    auth: AuthConfig = Field(default_factory=AuthConfig)
    output: OutputConfig = Field(default_factory=OutputConfig)
    integration: IntegrationConfig = Field(default_factory=IntegrationConfig)
    log_level: LogLevel = Field(LogLevel.INFO, description="Logging level")
    config_dir: Optional[Path] = Field(None, description="Configuration directory path")
    
    class Config:
        json_encoders = {
            Path: str
        }
