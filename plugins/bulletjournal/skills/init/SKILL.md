---
name: bulletjournal:init
description: Initialize bulletjournal plugin settings for this vault. Use when the user says "init bulletjournal", "setup bulletjournal", "configure bulletjournal", or "/bulletjournal:init". Writes .claude/bulletjournal.local.md with vault paths and tool paths so other bulletjournal skills work without hardcoded values.
argument-hint: "[--daily PATH] [--journal PATH] [--templates PATH] [--projects PATH] [--inbox PATH] [--openclaw PATH] [--qmd PATH]"
allowed-tools: ["Read", "Write", "Bash"]
---

# bulletjournal:init

Write `.claude/bulletjournal.local.md` with vault layout and integration paths. Run once per vault. All other bulletjournal skills read this file — without it they fall back to conventional defaults (which work for standard Obsidian PARA vaults).

## Arguments

| Flag | Description | Default |
|------|-------------|---------|
| `--daily PATH` | Prefix for daily notes | `daily` |
| `--journal PATH` | Prefix for journal notes | `journal` |
| `--templates PATH` | Obsidian templates folder | `Templates` |
| `--projects PATH` | Projects folder | `10-Projects` |
| `--inbox PATH` | Inbox folder | `00-Inbox` |
| `--areas PATH` | Areas folder | `20-Areas` |
| `--resources PATH` | Resources folder | `30-Resources` |
| `--archive PATH` | Archive folder | `40-Archive` |
| `--openclaw PATH` | Absolute path to OpenClaw workspace | (none — skips OpenClaw integration) |
| `--qmd PATH` | Path to qmd CLI binary | auto-detect |

## Steps

### 1. Parse arguments

Extract any `--flag value` pairs from the invocation arguments. Store as variables alongside defaults:

```
daily_path      = --daily      or "daily"
journal_path    = --journal    or "journal"
templates_path  = --templates  or "Templates"
projects_path   = --projects   or "10-Projects"
inbox_path      = --inbox      or "00-Inbox"
areas_path      = --areas      or "20-Areas"
resources_path  = --resources  or "30-Resources"
archive_path    = --archive    or "40-Archive"
openclaw_ws     = --openclaw   or ""
qmd_bin         = --qmd        or (auto-detect in step 2)
```

### 2. Auto-detect qmd binary

Run:

```bash
which qmd 2>/dev/null || find "$HOME/.local" "$HOME/.mise" /usr/local -name 'qmd' -type f 2>/dev/null | head -1
```

If `which qmd` succeeds, set `qmd_bin = "qmd"`. If find locates it, use that full path. If neither finds it, set `qmd_bin = "qmd"` and note it may need to be set manually.

### 3. Check for existing settings

```bash
cat .claude/bulletjournal.local.md 2>/dev/null
```

If the file exists, display its current content and ask:
> "Settings already exist. Overwrite? (yes/no)"

Stop if the user says no.

### 4. Prompt for missing values

If `--openclaw` was not provided, ask:
> "OpenClaw workspace path? (leave blank to skip OpenClaw integration)"

Accept the user's answer. If blank, `openclaw_ws` remains empty.

### 5. Show proposed configuration

Display all values before writing:

```
Setting              Value
-------------------  ----------------------------------------
daily_path           daily
journal_path         journal
templates_path       Templates
projects_path        10-Projects
inbox_path           00-Inbox
areas_path           20-Areas
resources_path       30-Resources
archive_path         40-Archive
qmd_bin              qmd
openclaw_workspace   /path/to/openclawy/workspace
```

Ask: "Write these settings? (yes/no)"

Stop if the user says no.

### 6. Write settings file

Create `.claude/` directory if needed:

```bash
mkdir -p .claude
```

Write `.claude/bulletjournal.local.md` using the confirmed values:

```markdown
---
daily_path: daily
journal_path: journal
templates_path: Templates
projects_path: 10-Projects
inbox_path: 00-Inbox
areas_path: 20-Areas
resources_path: 30-Resources
archive_path: 40-Archive
qmd_bin: qmd
openclaw_workspace: ""
---

# bulletjournal settings

Vault-specific configuration for the bulletjournal plugin.
Edit paths to match your Obsidian vault layout.
Changes take effect immediately for skills (no Claude Code restart needed).
```

Substitute the actual confirmed values for each field. If `openclaw_workspace` is empty, write `openclaw_workspace: ""`.

### 7. Update .gitignore

```bash
grep -q '\.claude/\*\.local\.md' .gitignore 2>/dev/null || echo '.claude/*.local.md' >> .gitignore
```

### 8. Confirm

```
bulletjournal settings written → .claude/bulletjournal.local.md
```

If qmd was not found in step 2, add a note:
```
⚠  qmd not found on PATH — set qmd_bin manually in .claude/bulletjournal.local.md
```
