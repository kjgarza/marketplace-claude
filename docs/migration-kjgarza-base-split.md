# Migration: plugin restructure (kjgarza-base split)

The owner-prefixed plugins are replaced by domain-named ones. Four plugins were renamed; three
new plugins were split out of `kjgarza-base`.

| Old name | New name | Notes |
|---|---|---|
| `kjgarza-product` | `product` | Same commands, agent, output style and skills |
| `kjgarza-base` | `dev-workflow` | Dev skills, `/execute-plan`, senior-dev-advisor agent, technical-lead output style |
| `kjgarza-base` | `job-search` | **New plugin** — job-search, find-jobs, find-linkedin-contacts |
| `kjgarza-base` | `smart-home` | **New plugin** — home-control |
| `kjgarza-base` | `file-tools` | **New plugin** — file-organizer, image-processing |
| `scholarly-comms-researcher` | `scholarly-research` | Same skills; agent renamed to `researcher` |
| `prototyping-skills` | `prototyping` | Unchanged contents |

## What happens automatically

`marketplace.json` carries a `renames` map:

```json
"renames": {
  "kjgarza-product": "product",
  "kjgarza-base": "dev-workflow",
  "scholarly-comms-researcher": "scholarly-research",
  "prototyping-skills": "prototyping"
}
```

After the marketplace updates, Claude Code rewrites each old key to the new one in
`enabledPlugins` and `pluginConfigs` (user, project and local settings) and shows
`Renamed to "<new>" in the "marketplace-claude" marketplace` once.

`kjgarza-base` can map to only one new name, so the rename covers `dev-workflow` alone.
`job-search`, `smart-home` and `file-tools` must be installed by hand.

## Steps for existing users

Auto-update is off by default for this marketplace, so first refresh it: `/plugin` →
**Marketplaces** → `marketplace-claude` → **Update marketplace**, or:

```
/plugin marketplace update marketplace-claude
```

Then restart Claude Code. The next session start fetches renamed plugins under their new
names (verified with a throwaway git marketplace on Claude Code 2.1.302). If a renamed plugin
instead reports `Plugin "<new>" not cached at <path>`, install it once under its new name:

```
/plugin install product@marketplace-claude              # had kjgarza-product
/plugin install dev-workflow@marketplace-claude         # had kjgarza-base
/plugin install scholarly-research@marketplace-claude   # had scholarly-comms-researcher
/plugin install prototyping@marketplace-claude          # had prototyping-skills
```

If you had `kjgarza-base` and used its job, home or file skills, also install:

```
/plugin install job-search@marketplace-claude
/plugin install smart-home@marketplace-claude
/plugin install file-tools@marketplace-claude
```

Restart Claude Code (or run `/reload-plugins`) afterwards.

### If the rename didn't apply

The `renames` map isn't always applied to an existing install. One real setup kept the old
names after **Update marketplace** and a restart, even though the local marketplace copy had
the map. Its `~/.claude/settings.json` was a symlink into a dotfiles repo, and the old plugin
was enabled in several scopes. Neither cause was confirmed.

Check from a shell:

```bash
claude plugin list | grep -A3 '@marketplace-claude'
```

If an old name (`kjgarza-base`, `kjgarza-product`, `scholarly-comms-researcher`,
`prototyping-skills`) is still listed, swap it by hand. These commands write only your user
settings, so run them from any folder (your home directory is safest):

```bash
claude plugin uninstall kjgarza-base@marketplace-claude --scope user
claude plugin install dev-workflow@marketplace-claude --scope user
```

Repeat for each old → new pair you had, then add `job-search`, `smart-home` or `file-tools`
as above. The CLI writes through a symlinked `settings.json`, so a dotfiles link stays
intact. Check with `ls -l ~/.claude/settings.json`.

**Project and local scopes.** A repo's `.claude/settings.json` or `.claude/settings.local.json`
can still name an old plugin. Find and rewrite those files (adjust the search root):

```bash
grep -rl --include='settings*.json' -E '"(kjgarza-base|kjgarza-product|scholarly-comms-researcher|prototyping-skills)@marketplace-claude"' ~/code \
  | xargs sed -i '' \
      -e 's/"kjgarza-product@marketplace-claude"/"product@marketplace-claude"/' \
      -e 's/"kjgarza-base@marketplace-claude"/"dev-workflow@marketplace-claude"/' \
      -e 's/"scholarly-comms-researcher@marketplace-claude"/"scholarly-research@marketplace-claude"/' \
      -e 's/"prototyping-skills@marketplace-claude"/"prototyping@marketplace-claude"/'
```

`sed -i ''` is the macOS form. On Linux use `sed -i`. A checked-in `.claude/settings.json`
then needs a commit in each repo. Commit only that file
(`git commit -m "…" -- .claude/settings.json`) so unrelated work stays out.

## Changed invocation names

The plugin prefix changes with the plugin name, so update any scripts, notes or prompts that
call these directly.

| Old | New |
|---|---|
| `/kjgarza-base:exe-my-plan` | `/dev-workflow:execute-plan` |
| `/kjgarza-base:<skill>` (spike, metaprompt, session-cleanup, project-scaffold, skill-creator) | `/dev-workflow:<skill>` |
| `/kjgarza-base:job-search`, `find-jobs`, `find-linkedin-contacts` | `/job-search:<skill>` |
| `/kjgarza-base:home-control` | `/smart-home:home-control` |
| `/kjgarza-base:file-organizer`, `image-processing` | `/file-tools:<skill>` |
| `/kjgarza-product:<command or skill>` | `/product:<command or skill>` |
| `scholarly-comms-researcher` agent | `scholarly-research:researcher` |
| `/prototyping-skills:<skill>` | `/prototyping:<skill>` |

## Removed

- `kjgarza-base` commands `/generate-api` and `/generate-ui` — use the `prototyping` skills of
  the same name (`/prototyping:generate-api`, `/prototyping:generate-ui`).
- `babysit-pr` now lives only in the `dev-flow` plugin (`/plugin install dev-flow@marketplace-claude`).
