---
description: Rules for creating and modifying plugins in this marketplace
---

## Plugin Development Rules

When creating or modifying any plugin, invoke the `plugin-dev:*` skill suite — canonical patterns for skills, commands, agents, hooks, and plugin structure.

Official skills reference: https://github.com/anthropics/claude-plugins-official/tree/main/plugins/plugin-dev

Key skills to use:
- `plugin-dev:plugin-structure` — directory layout and plugin manifest
- `plugin-dev:skill-development` — SKILL.md format and frontmatter
- `plugin-dev:command-development` — slash command conventions
- `plugin-dev:agent-development` — agent definition files
- `plugin-dev:hook-development` — hook configuration

---

## Plugin Manifest

Every plugin **must** have `.claude-plugin/plugin.json`. This is the canonical location — do NOT put it at the plugin root.

**Minimum:**
```json
{ "name": "plugin-name" }
```

**Recommended template:**
```json
{
  "name": "plugin-name",
  "version": "1.0.0",
  "description": "One-sentence description of what this plugin does.",
  "author": { "name": "Kristian Garza", "email": "kj.garza@gmail.com" },
  "license": "MIT",
  "keywords": ["keyword1", "keyword2"]
}
```

Component paths are **auto-discovered** — only specify in plugin.json if deviating from defaults:
- Commands: all `.md` in `commands/`
- Agents: all `.md` in `agents/`
- Skills: all `SKILL.md` in `skills/*/`
- Hooks: `hooks/hooks.json`
- MCP servers: `.mcp.json`

**Never hardcode absolute paths** — always use `${CLAUDE_PLUGIN_ROOT}`.

---

## Skill Format

Each skill lives at `skills/<skill-name>/SKILL.md`.

**Required frontmatter:**
```yaml
---
name: skill-name
description: This skill should be used when the user asks to "phrase 1", "phrase 2", or describes wanting to "use-case description".
---
```

**Rules:**
- `description` **must** start with `"This skill should be used when..."` (third-person)
- Include at least 3 quoted trigger phrases representing realistic user requests
- Body uses **imperative/directive** form: "Validate the input" not "You should validate"
- Keep SKILL.md under 2,000 words — move detail to `references/` sub-directory
- If the skill runs Bash or external scripts, declare `allowed-tools` frontmatter

**With tools and args:**
```yaml
---
name: skill-name
description: This skill should be used when the user asks to "..."
allowed-tools: ["Bash", "Read", "Write"]
argument-hint: "[optional-arg description]"
---
```

**Progressive disclosure structure:**
```
skills/skill-name/
├── SKILL.md          # always loaded — entry point only
├── references/       # loaded on demand — API docs, patterns, large tables
├── examples/         # working templates, sample outputs
└── scripts/          # executable scripts (chmod +x; not read by Claude)
```

---

## Command Format

Commands live in `commands/<verb-noun>.md` (kebab-case, verb-noun pattern).

**Frontmatter:**
```yaml
---
description: Brief description shown in /help
allowed-tools: Read, Bash(git:*)
argument-hint: [arg1] [arg2]
model: sonnet
---
```

**Dynamic values:**
- `$ARGUMENTS` — full argument string
- `$1`, `$2` — positional args
- `@filepath` or `@$1` — file content injection
- `` !`command` `` — inline bash output

Commands are instructions **for Claude**, not messages to the user. Write as directives.

---

## Agent Format

Agents live in `agents/<name>.md`. Auto-discovered from the `agents/` directory.

**Frontmatter:**
```yaml
---
description: Agent role and when to invoke it
---
```

Body contains detailed instructions, persona, and knowledge the agent needs.

---

## Hook Format

Plugin hooks live in `hooks/hooks.json` with the `hooks` wrapper:
```json
{
  "description": "What these hooks enforce",
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/validate.sh",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

Settings.json hooks use the same structure **without** the outer `{"description": ..., "hooks": ...}` wrapper.

**Available events:** `PreToolUse`, `PostToolUse`, `Stop`, `SubagentStop`, `UserPromptSubmit`, `SessionStart`, `SessionEnd`, `PreCompact`, `Notification`

Hook types:
- `"type": "command"` — Bash, deterministic, fast (default timeout: 60s)
- `"type": "prompt"` — LLM-driven, for context-aware validation (default timeout: 30s)

Hooks load at session start — changes require restart.

---

## User Configuration Pattern

If your plugin needs per-user or per-project settings, use `.claude/<plugin-name>.local.md` with YAML frontmatter:

```markdown
---
interests: art, food, music
neighborhood: Schöneberg
lookahead_days: 7
---

Additional freeform notes or context.
```

Read this file in skills with the `Read` tool. Document the required fields in the plugin README.

---

## Definition of Done

Every new plugin must ship with a `DOD.md`. Use the template at `.claude/rules/dod-template.md`.

A plugin is complete when:
- [ ] `.claude-plugin/plugin.json` exists and is valid JSON
- [ ] All `SKILL.md` files have `name` and `description` frontmatter with trigger phrases
- [ ] All hook scripts use `${CLAUDE_PLUGIN_ROOT}`, not hardcoded paths
- [ ] `marketplace.json` entry added with correct `source` path
- [ ] `bash scripts/validate-plugin.sh <plugin-name>` passes with no errors

---

## Validation

After any plugin change, run:
```bash
bash scripts/validate-plugin.sh <plugin-name>
```

This checks:
1. `.claude-plugin/plugin.json` exists and is valid JSON
2. All `SKILL.md` files have `name` and `description` frontmatter
3. Skill `description` starts with `"This skill should be used when"`
4. Hook scripts referenced in `hooks/hooks.json` exist on disk
5. `marketplace.json` has an entry for this plugin with a resolvable `source` path
