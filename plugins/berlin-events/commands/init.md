---
name: init
description: Initialize berlin-events user settings by creating .claude/berlin-events.local.md from provided arguments
argument-hint: "[neighborhood=<name>] [interests=art|food|art,food] [calendar_id=<id>] [lookahead_days=<n>]"
allowed-tools: Read, Write, Edit, Bash(mkdir:*), Bash(cat:*)
---

# Initialize Berlin Events Settings

Create `.claude/berlin-events.local.md` in the current project root using user-provided arguments and safe defaults.

## Steps

1. Parse `$ARGUMENTS` as optional `key=value` pairs:
   - `neighborhood`
   - `interests`
   - `calendar_id`
   - `lookahead_days`

2. If `neighborhood` or `interests` is missing, ask the user for the missing values.

3. Apply defaults for any remaining unset values:
   - `neighborhood: Mitte`
   - `interests: art, food`
   - `calendar_id: primary`
   - `lookahead_days: 14`

4. Ensure the `.claude/` directory exists in the workspace root.

5. Write `.claude/berlin-events.local.md` with YAML frontmatter:

```yaml
---
neighborhood: <resolved neighborhood>
interests: <resolved interests>
calendar_id: <resolved calendar_id>
lookahead_days: <resolved lookahead_days>
---
```

6. Confirm the file path and echo the resolved values.

