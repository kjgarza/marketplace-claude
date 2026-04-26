---
description: Rules for creating and modifying plugins in this marketplace
---

## Plugin Development Rules

When creating or modifying any plugin, invoke the `plugin-dev:*` skill suite — canonical patterns for skills, commands, agents, hooks, and plugin structure.

Official skills reference: https://github.com/anthropics/claude-plugins-official/tree/main/plugins/plugin-dev

Key skills to use:
- `plugin-dev:plugin-structure` — directory layout and plugin.json
- `plugin-dev:skill-development` — SKILL.md format and frontmatter
- `plugin-dev:command-development` — slash command conventions
- `plugin-dev:agent-development` — agent definition files
- `plugin-dev:hook-development` — hook configuration

After any plugin change, validate:
1. `marketplace.json` is valid JSON with correct source paths
2. `plugin.json` (if present) references existing files
3. All SKILL.md files have valid YAML frontmatter with `name` and `description`
