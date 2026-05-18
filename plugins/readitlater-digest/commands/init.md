---
name: init
description: Initialize readitlater-digest settings by creating .claude/readitlater-digest.local.md from user arguments
argument-hint: "[vault_path=/path/to/vault] [inbox_folder=<name>] [digest_folder=<name>] [archive_folder=<path>]"
allowed-tools: Read, Write, Edit, Bash(mkdir:*), Bash(cat:*)
---

# Initialize ReadItLater Digest Settings

Create `.claude/readitlater-digest.local.md` in the current project root using user input arguments.

## Steps

1. Parse `$ARGUMENTS` as optional `key=value` pairs:
   - `vault_path`
   - `inbox_folder`
   - `digest_folder`
   - `archive_folder`

2. If `vault_path` is missing, ask the user for it before continuing.

3. Apply defaults for optional unset values:
   - `inbox_folder: ReadItLater Inbox`
   - `digest_folder: Digests`
   - `archive_folder: <inbox_folder>/Archive`

4. Ensure the `.claude/` directory exists in the workspace root.

5. Write `.claude/readitlater-digest.local.md` with YAML frontmatter:

```yaml
---
vault_path: <resolved vault_path>
inbox_folder: <resolved inbox_folder>
digest_folder: <resolved digest_folder>
archive_folder: <resolved archive_folder>
---
```

6. Confirm the file path and summarize the resolved settings.

