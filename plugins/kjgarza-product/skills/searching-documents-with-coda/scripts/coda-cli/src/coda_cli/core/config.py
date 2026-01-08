"""Configuration management for Coda CLI."""

import os
import yaml
from pathlib import Path
from typing import Optional

from ..models.config import ConfigModel


class Config:
    """Configuration manager with environment and file-based settings."""

    def __init__(self, config_path: Optional[Path] = None):
        self.config_path = config_path or self._get_default_config_path()
        self.config = self._load_config()

    def _get_default_config_path(self) -> Path:
        """Get the default configuration file path."""
        config_dir = Path.home() / ".coda"
        config_dir.mkdir(exist_ok=True)
        return config_dir / "cli-config.yaml"

    def _load_config(self) -> ConfigModel:
        """Load configuration from file and environment."""
        # Start with defaults
        config_data = {}

        # Load from file if it exists
        if self.config_path.exists():
            try:
                with open(self.config_path, "r", encoding="utf-8") as f:
                    file_config = yaml.safe_load(f) or {}
                config_data.update(file_config)
            except (yaml.YAMLError, OSError):
                pass  # Use defaults if config file is invalid

        # Override with environment variables
        if os.getenv("CODA_API_KEY"):
            config_data.setdefault("auth", {})["api_key"] = os.getenv("CODA_API_KEY")

        if os.getenv("CODA_API_ENDPOINT"):
            config_data.setdefault("auth", {})["api_endpoint"] = os.getenv(
                "CODA_API_ENDPOINT"
            )

        if os.getenv("CODA_CLI_FORMAT"):
            config_data.setdefault("output", {})["format"] = os.getenv(
                "CODA_CLI_FORMAT"
            )

        return ConfigModel.model_validate(config_data)

    def save_config(self) -> None:
        """Save current configuration to file."""
        # Ensure directory exists
        self.config_path.parent.mkdir(parents=True, exist_ok=True)

        # Convert to dict and remove sensitive data
        config_dict = self.config.model_dump(exclude={"auth": {"api_key"}})

        # Write to file
        with open(self.config_path, "w", encoding="utf-8") as f:
            yaml.dump(config_dict, f, default_flow_style=False, sort_keys=True)

    def get_api_key(self) -> Optional[str]:
        """Get API key from config or environment."""
        return self.config.auth.api_key or os.getenv("CODA_API_KEY")

    def set_api_key(self, api_key: str) -> None:
        """Set API key in config (not saved to file for security)."""
        self.config.auth.api_key = api_key

    def get_output_format(self) -> str:
        """Get output format setting."""
        return self.config.output.format.value

    def set_output_format(self, format_name: str) -> None:
        """Set output format and save to config."""
        from ..models.config import OutputFormat

        self.config.output.format = OutputFormat(format_name)
        self.save_config()

    def show_config_summary(self) -> dict[str, str]:
        """Get configuration summary for display."""
        api_key = self.get_api_key()
        api_key_display = (
            f"{api_key[:8]}...{api_key[-4:]}" if api_key else "Not set"
        )

        return {
            "Config file": str(self.config_path),
            "API endpoint": self.config.auth.api_endpoint,
            "API key": api_key_display,
            "Output format": self.config.output.format.value,
            "Show suggestions": str(self.config.output.show_suggestions),
            "Claude skills": str(self.config.integration.claude_skills),
        }