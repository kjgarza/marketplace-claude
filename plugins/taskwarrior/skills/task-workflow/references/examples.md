# Taskwarrior Examples: Multiline Tasks and Notes

## Multiline Task Descriptions

Taskwarrior task descriptions are single-line. For multi-line content, use **annotations**.
Each annotation is a separate line attached to the task — independently removable.

### Pattern: Acceptance Criteria as Annotations

```bash
# Add task
task add "Implement user auth endpoint" project:Work.API priority:H

# Add acceptance criteria one annotation per line
task <id> annotate "AC1: POST /auth/login returns JWT on valid credentials"
task <id> annotate "AC2: returns 401 on invalid password"
task <id> annotate "AC3: rate-limit to 10 req/min per IP"
task <id> annotate "AC4: log failed attempts to audit table"

# View the full task with all annotations
task <id> info
```

### Pattern: Technical Notes as Annotations

```bash
task add "Debug slow SQL queries on dashboard" project:Work.DB priority:M

task <id> annotate "Affected query: SELECT * FROM events WHERE user_id=? ORDER BY ts DESC"
task <id> annotate "EXPLAIN ANALYZE shows seq scan — missing index on (user_id, ts)"
task <id> annotate "Fix: CREATE INDEX CONCURRENTLY events_user_ts ON events(user_id, ts DESC)"
task <id> annotate "Reference: https://www.postgresql.org/docs/current/indexes-multicolumn.html"
```

### Pattern: Step-by-Step Instructions

```bash
task add "Deploy v2.3 to production" project:Work.Ops priority:H due:friday

task <id> annotate "Step 1: run migrations — npm run migrate:prod"
task <id> annotate "Step 2: deploy API — kubectl rollout restart deploy/api"
task <id> annotate "Step 3: verify health — curl https://api.example.com/health"
task <id> annotate "Step 4: notify team in #releases Slack"
task <id> annotate "Runbook: https://notion.so/team/deploy-runbook"
```

## Linking Notes and Context

### Obsidian Notes

```bash
# Attach a project brief from Obsidian
task <id> annotate "obsidian://open?vault=aves&file=Projects/finance-pilot/brief.md"

# Attach a meeting notes page
task <id> annotate "obsidian://open?vault=aves&file=Areas/Engineering/2025-05-18-standup.md"
```

See `references/obsidian-vault.md` for vault name and base path configuration.

### GitHub Issues and PRs

```bash
# Link to the source issue
task <id> annotate "https://github.com/org/repo/issues/142"

# Link to the implementation PR
task <id> annotate "https://github.com/org/repo/pull/189"

# After closing task, remember to close the issue:
# task <id> info → retrieve the URL → close/comment on GitHub
```

### Local Files

```bash
# Source file to edit
task <id> annotate "~/code/finance-de/src/auth/jwt.rs"

# Config file changed
task <id> annotate "~/code/infra/terraform/prod/api.tf"
```

## Complex Real-World Examples

### Example 1: Bug Investigation Task

```bash
# Capture
task add "Fix 500 error on invoice PDF export" project:Work.Backend priority:H

# Record initial context
task <new-id> annotate "Sentry alert: https://sentry.io/org/issues/12345"
task <new-id> annotate "Affected route: POST /api/invoices/:id/export"
task <new-id> annotate "Stack trace: TypeError in pdf_generator.py line 87"

# Start
task <new-id> start

# Progress annotation after investigation
task <new-id> annotate "Root cause: fonttools dependency missing on prod server"
task <new-id> annotate "Fix: add fonttools==4.43.1 to requirements.txt"

# Completion
task <new-id> done
```

### Example 2: Feature Implementation Task

```bash
# Capture with sub-project
task add "Add dark mode toggle" project:App.UI priority:M

# Requirements
task <id> annotate "Spec: https://figma.com/file/abc123/dark-mode-spec"
task <id> annotate "Store preference in localStorage key 'theme'"
task <id> annotate "Apply class 'dark' to <html> element"
task <id> annotate "Respect prefers-color-scheme on first load"

# Implementation file links
task <id> annotate "~/code/app/src/hooks/useTheme.ts"
task <id> annotate "~/code/app/src/components/ThemeToggle.tsx"

# Done
task <id> done
```

### Example 3: Research / Spike Task

```bash
task add "Evaluate TaskChampion sync options" project:Infra priority:L

task <id> annotate "Compare: taskchampion-sync-server vs self-hosted alternatives"
task <id> annotate "Criteria: cost, latency, reliability, maintenance burden"
task <id> annotate "Docs: https://taskwarrior.org/docs/taskchampion/"
task <id> annotate "Findings: self-hosting preferred, ~2h setup"
task <id> annotate "Decision: use taskchampion-sync-server on fly.io"

task <id> done
```

### Example 4: Blocked Task Lifecycle

```bash
# Add task
task add "Implement payment webhook handler" project:Work.Payments priority:H

# Blocked immediately — waiting for credentials
task <id> modify +blocked
task <id> annotate "Blocked: need Stripe test webhook secret from platform team"
task <id> modify wait:2025-06-01   # hide until expected unblock date

# Unblocked — received credentials
task <id> modify -blocked wait:   # remove wait
task <id> annotate "Unblocked: received Stripe test secret from @alex"
task <id> start

# Done
task <id> done
```

## Reading Multiline Context from a Task

When picking up a task, always read its full record:

```bash
task <id> info
```

The output includes:
- Description (what to do)
- All annotations (context, notes, links, progress)
- Status, project, priority, due date
- Dependencies (blocked by / blocks)
- Entry and modification dates

Open every URL and file path annotation before starting work — they are the execution context.

## Removing Specific Annotations

Each annotation is removable by substring match:

```bash
# Remove a stale link
task 42 denotate "sentry.io/org/issues/11111"

# Remove a resolved blocker note
task 42 denotate "Blocked: need Stripe"
```

If multiple annotations match the substring, Taskwarrior asks for confirmation.
