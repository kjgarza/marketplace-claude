# Obsidian Vault Configuration

## Vault Setup

Vault name: `<fill in — check ~/.config/obsidian/ or the OPENCLAW_NOTES_DIR env var>`
Base path: `<fill in — the root of the vault on disk>`

> Replace the placeholders above before using Obsidian URI annotations.

## Annotation URI Format

Always use the `open?vault=` form — it works regardless of path prefix:

```
obsidian://open?vault=<vault-name>&file=<relative-path-within-vault>
```

Example:
```bash
task 42 annotate "obsidian://open?vault=aves&file=Projects/finanz-pilot/pension.md"
```

## PARA Structure Patterns

| Area      | URI pattern                                                                   |
|-----------|-------------------------------------------------------------------------------|
| Projects  | `obsidian://open?vault=<vault>&file=Projects/<project-slug>/<note>.md`        |
| Areas     | `obsidian://open?vault=<vault>&file=Areas/<area>/<note>.md`                   |
| Resources | `obsidian://open?vault=<vault>&file=Resources/<topic>/<note>.md`              |
| Archive   | `obsidian://open?vault=<vault>&file=Archive/<project-slug>/<note>.md`         |

## Task-to-Note Linking Rule

When a task is created that corresponds to an existing project note, annotate the task
immediately with its Obsidian URI:

```bash
task <id> annotate "obsidian://open?vault=<vault>&file=Projects/<slug>/<note>.md"
```

If no note exists yet, skip the annotation — do not create a placeholder note.
