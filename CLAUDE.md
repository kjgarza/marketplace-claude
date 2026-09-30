# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

A Claude Code plugin marketplace — a curated collection of plugins installable via `/plugin marketplace add kjgarza/marketplace-claude`. Each plugin bundles skills, commands, agents, hooks, and/or output styles for Claude Code.

## Repository Structure

```
.claude-plugin/marketplace.json   ← Marketplace manifest (registry of all plugins)
plugins/<name>/                   ← Individual plugins
  plugin.json                     ← Plugin manifest (legacy root-level manifest; prefer .claude-plugin/plugin.json)
  skills/<skill-name>/SKILL.md    ← Skill definitions (frontmatter + instructions)
  commands/<name>.md              ← Slash command definitions
  agents/<name>.md                ← Agent definitions
  hooks/                          ← Hook configurations
  output-styles/                  ← Output style definitions
  scripts/                        ← Supporting scripts
```

## Key Conventions

- **Adding a plugin**: Create a directory under `plugins/`, add its components, then register it in `.claude-plugin/marketplace.json` with name, source path, description, version, author, license, category, and keywords.
- **Skill format**: Each skill lives in `skills/<skill-name>/SKILL.md` with YAML frontmatter (`name`, `description`) followed by markdown instructions.
- **Command format**: Commands are markdown files in `commands/` with frontmatter defining the slash command.
- **Agent format**: Agents are markdown files in `agents/` referenced from `plugin.json`.
- **Categories in use**: `utilities`, `documentation`, `development`, `productivity`.

## Current Plugins

| Plugin | Category | Key Components |
|--------|----------|----------------|
| dev-workflow | development | Agent + commands + skills + output-style (babysit-pr, spike, metaprompt, session-cleanup, planning-with-files, scaffolding, skill-creator) |
| job-search | productivity | Skills (find-jobs, find-linkedin-contacts) |
| smart-home | utilities | Skills (home-control) |
| file-tools | utilities | Skills (file-organizer, image-processing) |
| scholarly-research | documentation | Agent + skills (literature-review, scientific-writing, etc.) |
| product | productivity | Agent + commands + skills + output-style (PRD, user stories, Office docs, Coda/Drive/Dimensions search) |
| bookclub | productivity | Agents + commands + skills (Slack comms, discussion guides) |
| rapid-mvp | development | Commands + skills (Next.js/11ty monorepo scaffolding) |
| berlin-events | productivity | Agents + skills + scripts (Berlin art/food event discovery; shown-dedup + taste feedback) |
| readitlater-digest | productivity | Skills + scripts (Obsidian bookmark digests, SQLite, feedback loop, catch-up) |
| prototyping | development | Agent + skills + hooks (Bun monorepo stack: Hono API, Next.js UI, MCP) |
| ideation | productivity | Agent + skills + hooks (5-stage ideation pipeline with stage validation) |
| vhs-berlin-agent | productivity | Skills + bun scripts (VHS course search/watch; no MCP) |
| berlin-flats | productivity | Commands + agents + node scripts (rental hunt, scam-judge, triage, calibrate) |
| taskwarrior | productivity | Skills + hooks (task lifecycle; SessionStart/Stop enforcement) |
| finanz-pilot | productivity | Agents + commands + skills + bun scripts (German finance; projection models) |
| bulletjournal | productivity | Bullet-journal workflow automation (excluded from the autonomy overhaul) |

## Automation

Scheduled, hands-off runs of the productivity plugins live in [`automation/`](automation/) and
install as macOS launchd agents that deliver results to Telegram. See [AUTOMATION.md](AUTOMATION.md).

## Rules

Avoid multiline `python -c`, `node -e`, `ruby -e`, or shell commands with quoted newlines and `#` comments.
When code is more than one line, write it to a temporary script or a file under scripts/ and run that file instead.

Plugin development rules and validation steps live in `.claude/rules/plugin-development.md`.

Skill content quality standards (naming, conciseness, progressive disclosure, evaluations) live in `.claude/rules/skill-standards.md`.
