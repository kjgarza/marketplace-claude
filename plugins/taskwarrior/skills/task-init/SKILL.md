---
name: task-init
description: >
  This skill should be used when the user asks to "initialize taskwarrior", "set up taskwarrior",
  "configure taskwarrior for this project", "run /init for taskwarrior", "set up task management",
  "bootstrap the task plugin", "configure task contexts", or "first-time taskwarrior setup".
  Guides the complete initial configuration of Taskwarrior so that the task-workflow skill
  operates correctly.
argument-hint: "[project-name]"
allowed-tools:
  - Bash
  - Read
  - Write
portable: false
---

> `<plugin_dir>` = this plugin's root directory (two levels above this SKILL.md).

# Taskwarrior Initialization

Set up Taskwarrior for use with this plugin. Run these steps in order. Taskwarrior must
be installed and accessible as the `task` command before proceeding.

## Step 1: Verify Installation

```bash
task --version
```

If missing, install:
- macOS: `brew install task`
- Ubuntu/Debian: `sudo apt install taskwarrior`
- Arch: `sudo pacman -S task`
- Windows: `winget install GnuPG.GnuPG && scoop install task`

## Step 2: Verify Data Directory

```bash
task config data.location
# Default: ~/.task — acceptable for most setups
```

## Step 3: Configure Core Defaults

Apply these settings to reduce friction during daily use:

```bash
# Disable interactive confirmation prompts for scripting
task config confirmation off

# Show task IDs and affected counts in output
task config verbose label,new-id,affected,edit,special,project,sync,filter,footnote,recur,unwait

# Default priority when none specified
task config default.priority M

# Enable urgency inheritance — blocked tasks adopt blocker urgency
task config urgency.inherit 1

# Boost urgency for the +next tag
task config urgency.user.tag.next.coefficient 15.0

# Boost urgency for +urgent tag
task config urgency.user.tag.urgent.coefficient 10.0
```

## Step 4: Configure Project Contexts (Optional)

Define contexts to focus the task view by project area:

```bash
# Work context — shows only work tasks
task context define work "project:Work or +work"

# Home context — shows only personal tasks
task context define home "project:Home or +home"

# List defined contexts
task context list

# Switch context (or disable)
task context work
task context none
```

Adapt context names and filters to the user's project structure.

## Step 5: Configure an Initial Project

If the user provided a project name via argument, create a starter task:

```bash
# Create a kickoff task for the project
task add "Project setup complete" project:<ProjectName> priority:L
task <new-id> done
```

This seeds the project in Taskwarrior's project list.

## Step 6: Configure Obsidian Vault (Optional)

If the user uses Obsidian for notes, configure the vault reference file so that
annotation URIs work correctly:

1. Find the vault name: check `~/.config/obsidian/` or the `OPENCLAW_NOTES_DIR` env var
2. Edit `skills/task-workflow/references/obsidian-vault.md` with:
   - Vault name
   - Base path on disk
   - Any PARA structure patterns for this project

## Step 7: Verify Setup

Run the summary script to confirm everything is working:

```bash
bash <plugin_dir>/skills/task-workflow/scripts/tw-summary.sh
```

Expected output: summary header with sections for overdue, today, active, and next.
If `task` errors, check `task config data.location` and re-run Step 2.

## Step 8: Show Quick Reference

After initialization completes, display this reference to the user:

```
Taskwarrior initialized. Core workflow:

  Add:     task add "description" project:Name
  Start:   task <id> start
  Note:    task <id> annotate "note or URL"
  Done:    task <id> done
  View:    task next

Contexts: task context work / task context none
Summary:  task next | task +OVERDUE list | task +TODAY list
```

## Common Post-Setup Tasks

```bash
# Check what's pending
task next

# Add first real task
task add "First task" project:MyProject priority:M

# Verify urgency ordering makes sense
task list
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `task: command not found` | Install via package manager (Step 1) |
| `No matches` on any filter | No tasks exist yet — add one (Step 5) |
| Permission error on `~/.task` | `mkdir -p ~/.task && chmod 700 ~/.task` |
| Confirmations blocking scripts | `task config confirmation off` (Step 3) |
| Context filters too narrow | `task context none` to disable temporarily |
