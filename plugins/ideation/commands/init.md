---
name: init
description: Initialize ideation settings by creating .claude/ideation.local.md from user arguments
argument-hint: "[default_run_prefix=<prefix>] [output_root=<path>]"
allowed-tools: Read, Write, Edit, Bash(mkdir:*), Bash(cat:*)
---

# Initialize Ideation Settings

Create `.claude/ideation.local.md` in the current project root from user-provided arguments.

## Steps

1. Parse `$ARGUMENTS` as optional `key=value` pairs:
   - `default_run_prefix`
   - `output_root`

2. Apply defaults when values are missing:
   - `default_run_prefix: ideation-run`
   - `output_root: .`

3. Ensure the `.claude/` directory exists in the workspace root.

4. Write `.claude/ideation.local.md` with YAML frontmatter:

```yaml
---
default_run_prefix: "<resolved default_run_prefix>"
output_root: "<resolved output_root>"
---
```

5. Confirm the output path and show the resolved values.

