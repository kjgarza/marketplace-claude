---
name: ideation-prototype
description: >
  Build interactive React prototypes from selected UI concepts using the web-artifacts-builder
  skill. Each prototype is a React + TypeScript + Tailwind + shadcn/ui app bundled to a single
  HTML file. Supports incremental runs. Use when the user says "build prototype", "create HTML",
  "make it interactive", or invokes /ideation:prototype.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Bash
  - Skill
argument-hint: "[run-folder] [selection]"
---

# Ideation Prototype Builder

Build interactive prototypes from selected UI concepts. Each prototype is a React app (TypeScript + Tailwind + shadcn/ui) bundled to a single self-contained HTML file via the **web-artifacts-builder** skill.

## Prerequisites

The `web-artifacts-builder` skill is **preferred** for the richest output. Install it with:
```
/install-skill https://skills.sh/anthropics/skills/web-artifacts-builder
```

**Fallback when not installed:** if `web-artifacts-builder` is unavailable, do not abort.
Generate a single self-contained `.html` file (inline CSS + vanilla JS, or CDN React) per
`../ideation/references/html-prototype-spec.md`, written to the same `prototypes/` location.
Note in the output which path was used.

## Steps

1. **Read both files** from the run folder:
   - `reviewed_solutions.md` — for full solution specs (embedded in blockquotes)
   - `ui_concepts.md` — for ASCII UI concepts

2. **Validate inputs**:
   - Both files exist with valid YAML frontmatter
   - At least 1 solution has UI concepts
   - If invalid, report and stop

3. **Parse user selection**. The user specifies which UI(s) to prototype. Accepted formats:
   - **Pick one**: "Use ui_01_01_C" — Build from that single concept
   - **Combine**: "Combine ui_01_01_C layout with ui_01_01_F's navigation" — Merge elements
   - **Describe**: "Like C but with the data table from E" — Interpret and synthesize
   - **Batch**: "Prototype sol_01_01 and sol_01_02" — Use the first/best concept for each
   - **All**: "Prototype everything" — Use concept A for each passed solution

   If the user doesn't specify, ask which solutions and UI concepts they want prototyped.

4. **Create `prototypes/` directory** inside the run folder if it doesn't exist.

5. **For each selected solution+UI combination**, build a prototype using web-artifacts-builder:

   ### Step 5a: Initialize the React project

   ```bash
   bash scripts/init-artifact.sh {run-folder}/prototypes/solution_{sol_id}
   cd {run-folder}/prototypes/solution_{sol_id}
   ```

   This creates a fully configured project with React 18, TypeScript, Tailwind CSS, and 40+ shadcn/ui components.

   ### Step 5b: Develop the artifact

   Build the React app by editing the generated source files. Translate the selected ASCII UI concept into real components:

   **Content requirements**:
   - Header: solution name, tagline, problem area
   - Footer: `Prototype — {solution_id} — generated {date}`
   - Realistic placeholder data matching the solution's domain (never lorem ipsum)
   - Responsive layout (800px–1400px width)
   - Dark/light mode support via Tailwind's dark mode classes

   **Interaction model fidelity** — match components to the solution type:

   | Model | Build with |
   |-------|-----------|
   | **web** | shadcn/ui Tables, Tabs, NavigationMenu, Accordion, Card. Filterable/sortable data, working nav. |
   | **cli** | Custom terminal component with monospace font, fake command/response pairs, keyboard input handler. |
   | **bot** | Chat layout with message bubbles, ScrollArea, Input + Button for send, typing indicator animation. |
   | **api** | Tabs for methods, code blocks for JSON payloads, a "Try it" Button + response panel. |
   | **notification** | Card list with Badge for read/unread, dismiss buttons, filter Tabs (All/Unread). |
   | **extension** | Browser chrome frame (div mockup), Popover panel, settings Sheet. |
   | **mobile** | Max-width container (~390px), bottom navigation bar, touch-sized Button targets. |
   | **embedded** | Host application frame with embedded widget panel, ResizablePanel for the widget area. |

   **Design guidelines** (from web-artifacts-builder):
   - Avoid excessive centered layouts, purple gradients, uniform rounded corners, and Inter font
   - Use shadcn/ui components and Tailwind utilities — do not write raw CSS unless necessary
   - Keep it visually distinctive and production-grade

   ### Step 5c: Bundle to single HTML

   ```bash
   bash scripts/bundle-artifact.sh
   ```

   This produces `bundle.html` with all JS, CSS, and dependencies inlined.

   ### Step 5d: Move the bundle

   ```bash
   cp bundle.html {run-folder}/prototypes/solution_{sol_id}.html
   ```

6. **Incremental support**: If `prototypes/` already contains `.html` files from a previous run, do not overwrite them unless the user explicitly asks. New prototypes are added alongside existing ones. Project directories from previous builds can be reused if the user wants to iterate.

7. **Report**: List the `.html` files created with their paths. Suggest the user open them in a browser to test.

## Reference

- Build tool: [web-artifacts-builder](https://skills.sh/anthropics/skills/web-artifacts-builder) — React 18 + TypeScript + Vite + Tailwind + shadcn/ui
- Prototype requirements: [html-prototype-spec.md](../ideation/references/html-prototype-spec.md)
- Output path pattern: [data-contracts.md](../ideation/references/data-contracts.md) (Stage 5 section)
