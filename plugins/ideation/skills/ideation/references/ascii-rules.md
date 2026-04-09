# ASCII UI Concept Rules

## Size Constraints

- **Max width**: 60 characters (must fit in a standard code block)
- **Max height**: 30 lines

## Characters

### Box-drawing
Use Unicode box-drawing characters for structure:
```
┌ ┐ └ ┘ ─ │ ├ ┤ ┬ ┴ ┼
```

### Fill characters for emphasis
```
▓  Dense shade (active/selected areas)
░  Light shade (inactive/background)
█  Full block (progress bars, headers)
■  Filled square (list items, indicators)
□  Empty square (checkboxes unchecked)
```

### Interactive elements
Label interactive elements clearly:
```
[Button]        — clickable button
<input>         — text input field
<placeholder..> — text input with hint text
(radio)         — radio button
[x] checkbox    — checked checkbox
[ ] checkbox    — unchecked checkbox
[Link ->]       — navigational link
```

## Data Content

- Use **realistic placeholder data**, not lorem ipsum
- Names, dates, numbers, and labels should feel like real application data
- Match the domain of the solution being visualized

## Interaction Model Fidelity

Match the ASCII style to the solution's interaction model:
- **web** → Dashboard layout with navigation, panels, cards
- **cli** → Terminal with prompt, command output, status lines
- **bot** → Chat bubbles or conversation thread
- **api** → Request/response panels with JSON snippets
- **notification** → Inbox or feed layout with message cards
- **extension** → Browser chrome with popup panel
- **mobile** → Narrow viewport, touch-friendly controls
- **embedded** → Widget panel within a host application frame

## Labeling

- Every ASCII UI must have a 1-line description above the art
- Below the art, include:
  - `**Style**:` one of: dashboard, table, form, terminal, chat, cards, feed, widget
  - `**Key interactions**:` comma-separated list of primary user actions
