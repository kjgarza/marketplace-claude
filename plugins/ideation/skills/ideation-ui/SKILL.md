---
name: ideation-ui
description: >
  Generate 8 distinct ASCII UI concepts per passed solution. Each concept visualizes the
  primary screen/interface using box-drawing characters. Style matches the solution's
  interaction model. Use when the user says "generate UIs", "create UI concepts",
  "ASCII mockups", or invokes /ideation:ui.
allowed-tools:
  - Read
  - Write
  - Glob
argument-hint: "[run-folder]"
---

# Ideation UI Concepts

For each passed solution, generate 8 distinct ASCII UI concepts showing the primary screen or interface.

## Steps

1. **Read `reviewed_solutions.md`** from the run folder.

2. **Validate input**:
   - File exists with valid YAML frontmatter
   - At least 1 passed solution exists (has full spec in blockquote)
   - If invalid, report and stop

3. **Extract passed solutions**: Parse the passed solutions section. For each, extract:
   - Solution ID (`sol_XX_YY`)
   - Name and tagline
   - Interaction model (web, cli, bot, api, notification, extension, mobile, embedded)
   - Key features
   - Target user persona

4. **For each passed solution**, generate exactly 8 ASCII UI concepts. Read and follow [ascii-rules.md](../ideation/references/ascii-rules.md).

   Each UI concept must include:
   - **ID**: `ui_XX_YY_Z` where Z is A through H
   - **Title**: `### ui_XX_YY_Z — [1-line description of the design concept]`
   - **Description**: One paragraph explaining the design approach
   - **ASCII art**: In a fenced code block, max 60 characters wide, max 30 lines tall
   - **Style tag**: one of: dashboard, table, form, terminal, chat, cards, feed, widget
   - **Key interactions**: Comma-separated list of primary user actions

5. **Match interaction model to ASCII style**:
   - **web** → Dashboard layouts, navigation bars, card grids, sidebar panels
   - **cli** → Terminal with prompt `$`, command output, status bars
   - **bot** → Chat bubbles, conversation threads, typing indicators
   - **api** → Split request/response panels, JSON snippets, method tabs
   - **notification** → Email/message cards, inbox list, read/unread states
   - **extension** → Browser chrome frame with popup panel
   - **mobile** → Narrow viewport, bottom nav, touch-sized buttons
   - **embedded** → Widget within a host application frame

6. **Ensure visual diversity** across the 8 concepts:
   - Vary layout structure (single column, split pane, grid, tabs, wizard)
   - Vary information density (minimal vs. data-rich)
   - Vary navigation patterns (sidebar, top bar, bottom tabs, breadcrumbs)
   - At least 2 concepts should take an unconventional approach

7. **Use realistic data** in the ASCII art. Match the solution's domain — real-looking names, dates, metrics, labels. Never lorem ipsum.

8. **Write `ui_concepts.md`** with YAML frontmatter:

   ```yaml
   ---
   run_id: {from reviewed_solutions.md}
   created_at: {ISO8601 timestamp}
   input_file: "reviewed_solutions.md"
   version: "1.0"
   solutions_with_uis: {count of passed solutions}
   total_ui_concepts: {solutions_with_uis * 8}
   ---
   ```

   Group by solution: `## sol_XX_YY: [Name] (interaction_model, automation_level)`

9. **Report**: Show the user a summary — solutions covered, total concepts, and for each solution note which styles were used.

## Reference

- ASCII format rules: [ascii-rules.md](../ideation/references/ascii-rules.md)
- Output schema: [data-contracts.md](../ideation/references/data-contracts.md) (Stage 4 section)
