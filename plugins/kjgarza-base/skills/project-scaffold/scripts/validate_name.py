#!/usr/bin/env python3
"""Validate project names for the project-scaffold skill."""

import re
import sys


def validate_project_name(name: str) -> tuple[bool, str]:
    """
    Validate a project name against naming conventions.

    Rules:
    - Lowercase letters, numbers, and hyphens only (kebab-case)
    - Must start with a letter
    - Between 2-50 characters
    - No consecutive hyphens
    - Cannot start or end with a hyphen

    Returns:
        tuple: (is_valid, error_message or success_message)
    """
    if not name:
        return False, "Project name cannot be empty"

    if len(name) < 2:
        return False, "Project name must be at least 2 characters"

    if len(name) > 50:
        return False, "Project name must be 50 characters or less"

    if not name[0].isalpha():
        return False, "Project name must start with a letter"

    if not re.match(r'^[a-z][a-z0-9-]*$', name):
        return False, "Project name must contain only lowercase letters, numbers, and hyphens"

    if name.endswith('-'):
        return False, "Project name cannot end with a hyphen"

    if '--' in name:
        return False, "Project name cannot contain consecutive hyphens"

    # Check for reserved names
    reserved = {'node_modules', 'src', 'dist', 'build', 'test', 'tests', 'lib', 'bin'}
    if name in reserved:
        return False, f"'{name}' is a reserved name, please choose another"

    return True, f"'{name}' is a valid project name"


def to_pascal_case(name: str) -> str:
    """Convert kebab-case to PascalCase."""
    return ''.join(word.capitalize() for word in name.split('-'))


def to_snake_case(name: str) -> str:
    """Convert kebab-case to snake_case."""
    return name.replace('-', '_')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: validate_name.py <project-name> [--transform]")
        sys.exit(1)

    name = sys.argv[1]
    is_valid, message = validate_project_name(name)

    if '--transform' in sys.argv:
        if is_valid:
            print(f"kebab: {name}")
            print(f"pascal: {to_pascal_case(name)}")
            print(f"snake: {to_snake_case(name)}")
        else:
            print(f"Error: {message}")
            sys.exit(1)
    else:
        print(message)
        sys.exit(0 if is_valid else 1)
