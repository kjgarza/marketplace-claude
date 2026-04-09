# HTML Prototype Specification

Prototypes are built using the **web-artifacts-builder** skill, which provides a React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui stack, bundled to a single HTML file via Parcel.

## Build Workflow

```
1. bash scripts/init-artifact.sh <project-name>   → scaffolds React project
2. Edit source files to build the prototype UI
3. bash scripts/bundle-artifact.sh                 → produces bundle.html
4. Copy bundle.html to prototypes/solution_{id}.html
```

## Core Requirements

1. **Self-contained single HTML file** — The bundle step inlines all JS, CSS, and dependencies. No external CDN links or runtime fetches.
2. **Responsive** — Must work at 800px–1400px width. Use Tailwind responsive utilities (`md:`, `lg:`) and flexbox/grid.
3. **Dark/light mode** — Use Tailwind's `dark:` variant. The shadcn/ui theming system handles this via CSS variables.
4. **Interactive elements** — Use shadcn/ui components (Button, Input, Select, Tabs, etc.) for full keyboard and click support.
5. **Realistic data** — Use plausible placeholder data matching the solution's domain. Never lorem ipsum.

## Stack Details

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite (dev) + Parcel (bundle) |
| Styling | Tailwind CSS 3.4 with shadcn/ui theming |
| Components | 40+ shadcn/ui components (pre-installed) |
| Path aliases | `@/` configured |

## Structure

Each prototype must include:
- **Header**: Solution name, tagline, problem area
- **Main content**: Interactive prototype matching the UI concept
- **Footer**: `Prototype — {solution_id} — generated {date}`

## Design Guidelines

Avoid "AI slop":
- No excessive centered layouts
- No purple gradients
- No uniform rounded corners everywhere
- No Inter font as default
- Use shadcn/ui components idiomatically — they provide visual variety out of the box

## Interaction Model Fidelity

Match the prototype behavior to the solution's interaction model:

| Model | Must include |
|-------|-------------|
| **web** | Working navigation, expandable sections, filterable/sortable tables, hover states |
| **cli** | Terminal emulator with fake command/response pairs, keyboard input, scrolling history |
| **bot** | Chat interface with pre-scripted conversation turns, typing indicator, send button |
| **api** | Request/response viewer with example JSON payloads, try-it panel, method selector |
| **notification** | Inbox/feed view with sample messages, read/unread states, dismiss actions |
| **extension** | Browser chrome mockup with popup panel, badge icon, settings |
| **mobile** | Narrow viewport container, bottom navigation, touch-sized targets |
| **embedded** | Host application frame with resizable widget panel |

## Output Path

```
{run_folder}/prototypes/solution_{sol_id}.html
```

Each bundled file is standalone. Users open them directly in a browser.
