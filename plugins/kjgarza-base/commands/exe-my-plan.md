---
name: exe-my-plan
description: Execute my plan
argument-hint: <description>
allowed-tools:
  - Read
  - Write
  - Bash
  - "mcp__qmd__search"
  - "mcp__qmd__get"
  - "mcp__qmd__deep_search"
---


I have a plan in $ARGUMENTS . Skip all exploration and brainstorming. Read the plan and implement it now. For each independent task, proactively spawn a parallel sub-agent using the Task tool. Each sub-agent MUST: 1) Implement its assigned files, 2) Run `bunx tsc --noEmit` scoped to its files and fix any type errors, 3) Run `bunx biome check --apply` and fix any lint issues, 4) Verify all expected exports exist by grepping for them. After ALL sub-agents complete, run the full build with `bun run build` and full test suite with `bun test`. If anything fails, identify which agent's output caused the failure, fix it, and re-verify. Do not ask me questions — resolve all issues autonomously.
