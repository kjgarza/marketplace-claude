"""Coda CLI - AI-friendly command-line interface for Coda documents."""

__version__ = "0.1.0"
__author__ = "Digital Science"
__email__ = "info@digital-science.com"

from .core.client import CodaClient
from .core.config import Config

__all__ = ["CodaClient", "Config"]
