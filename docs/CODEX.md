# Using this marketplace outside Claude Code

Skills in this repo follow the [Agent Skills standard](https://agentskills.io) and are
consumable by OpenAI Codex CLI, Cursor, Gemini CLI, and other adopters.

## Install skills into a project (both Claude Code and Codex)

    npx skills add kjgarza/marketplace-claude --skill <skill-name>

This vendors the skill into `<repo>/.agents/skills/` (read natively by Codex),
symlinks it into `.claude/skills/` (read natively by Claude Code), and records it in
`skills-lock.json`. Commit all three. Update later with `npx skills update`.

For Claude-only extras (agents, hooks, output-styles), additionally enable the plugin in
`.claude/settings.json` → `"enabledPlugins": ["<plugin>@marketplace-claude"]`.

## Portability conventions

- Skills without a `portable:` field are cross-tool portable: resources referenced
  relative to the skill directory, no Claude-specific tool names in the body.
- `portable: false` in SKILL.md frontmatter = Claude-only (depends on plugin-shared
  scripts, MCP servers, or Claude tools). Do not vendor these elsewhere.
- `<skill_dir>` / `<plugin_dir>` placeholders in skill bodies mean the directory
  containing the SKILL.md / the plugin root, respectively.
- Enforced by `scripts/lint_portability.py` (runs in CI).

## Codex subagents

Claude agent `.md` files tagged `codex: true` in frontmatter are converted to Codex
TOML by `scripts/gen_codex_agents.py` into `adapters/codex/agents/`. Install one with:

    mkdir -p .codex/agents
    cp <marketplace>/adapters/codex/agents/<name>.toml .codex/agents/

Commands, hooks, and output-styles are not ported: command content belongs in skills
(Codex triggers skills via `$skill-name`), the single hook stays Claude-only, and
output-style personas can be pasted into a project's AGENTS.md.
