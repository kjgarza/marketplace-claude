"""Authentication management for Coda CLI."""

import os
from pathlib import Path
from typing import Optional

from ..core.config import Config
from ..models.responses import CommandResult, CommandType, Suggestion


class AuthManager:
    """Handle authentication setup and management."""

    def __init__(self, config: Optional[Config] = None):
        self.config = config or Config()

    def setup_interactive(self) -> CommandResult:
        """Interactive authentication setup."""
        # This will be implemented when we create the CLI commands
        # For now, return a placeholder
        return CommandResult(
            command_type=CommandType.AUTH_SETUP,
            success=False,
            message="Interactive setup not yet implemented",
            suggestions=[
                Suggestion(
                    command="export CODA_API_KEY='your-key-here'",
                    description="Set API key manually",
                    category="auth",
                )
            ],
        )

    def test_auth(self) -> bool:
        """Test if current authentication works."""
        api_key = self.config.get_api_key()
        return bool(api_key and len(api_key) > 10)

    def get_auth_status(self) -> dict[str, str]:
        """Get authentication status summary."""
        api_key = self.config.get_api_key()
        status = {
            "API Key": "Set" if api_key else "Not set",
            "API Endpoint": self.config.config.auth.api_endpoint,
            "Config File": str(self.config.config_path),
        }

        if api_key:
            status["API Key Preview"] = f"{api_key[:8]}...{api_key[-4:]}"

        return status

    def save_to_shell_profile(self, api_key: str) -> bool:
        """Save API key to shell profile."""
        shell = os.getenv("SHELL", "").split("/")[-1]
        home = Path.home()

        profile_files = {
            "zsh": home / ".zshrc",
            "bash": home / ".bashrc",
            "fish": home / ".config" / "fish" / "config.fish",
        }

        profile_file = profile_files.get(shell, home / ".bashrc")

        try:
            # Check if already exists
            if profile_file.exists():
                content = profile_file.read_text(encoding="utf-8")
                if "CODA_API_KEY" in content:
                    return True  # Already set

            # Append to profile
            with open(profile_file, "a", encoding="utf-8") as f:
                f.write(f"\n# Coda CLI API Key\nexport CODA_API_KEY='{api_key}'\n")

            return True
        except (OSError, IOError):
            return False