---
name: generate-ui
description: >
  This skill generates or scaffolds a Next.js dashboard UI using shadcn/ui with Server
  Components and Server Actions. It should be used when the user asks to build a UI,
  dashboard, frontend, visualisation, page, or component, or when working inside a
  packages/ui directory. It also applies when the user mentions Next.js, shadcn, React
  Server Components, Server Actions, "make this visible", "add a view for this", or
  "build the frontend."
allowed-tools:
  - Bash
  - Write
  - Edit
  - Read
  - Glob
  - Grep
  - AskUserQuestion
  - TaskCreate
argument-hint: "[page-or-component-name]"
---

# Next.js Dashboard UI Stack

Generate a Next.js App Router application using **shadcn/ui** components,
**React Server Components** by default, and **Server Actions** for mutations.
The runtime is **Bun**. This is always a dashboard-style interface.

## Defaults and Deviations

These are **team defaults**. Multiple people work on these prototypes. In **execution mode**,
follow these unless the project CLAUDE.md overrides them.

In **Plan mode**, suggest alternatives using the deviation protocol from the
`prototyping-skills:team-conventions` skill: state the default, name the alternative,
explain the trade-off, flag the blast radius, let the human decide.

## Workflow

Follow these three interactive checkpoints on every scaffold:

1. **Auth gate** — Before writing any files, use `AskUserQuestion` to ask:
   > "Do you want Google OAuth authentication on this UI? (Requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET env vars)"
   If yes, scaffold the full auth layer (see Authentication section) before pages.

2. **UI verification** — After scaffolding pages, use `TaskCreate` to queue a Puppeteer screenshot task so the user can visually confirm the app renders correctly.

See the **Verification Checklist** section at the end for the exact `TaskCreate` pattern.

## Team Defaults — Follow Unless Explicitly Overridden

1. **Component library**: shadcn/ui. Not Material UI, Chakra, Ant Design, etc.
2. **Icons**: Lucide (`lucide-react`). Not Heroicons, FontAwesome, etc.
3. **Data fetching**: Server Components with async functions. Not `useEffect` + `fetch`, not Tanstack Query, not SWR.
4. **Mutations**: Server Actions. Not client-side POST calls.
5. **State for server data**: RSC handles it. No Redux, Zustand, Jotai for data from the API.
6. **Router**: App Router (`app/` directory). Not Pages Router, not `getServerSideProps`.
7. **Client components**: Only add `"use client"` when genuinely needed (event handlers, useState, browser APIs).
8. **Types**: From `@repo/types`. Never duplicate.
9. **About page**: Every app MUST include an `/about` page (see below).
10. **Design tokens**: Use CSS custom properties and shadcn theme tokens to separate content from style. Never hard-code colors, spacing, or typography values.

## Authentication

Gate this section with `AskUserQuestion` before scaffolding any files:

```
"Do you want Google OAuth authentication on this UI? (Requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET env vars)"
```

If yes, scaffold the following files using the **Auth.js v5** pattern. See `references/auth.md` for full code.

**Files to create:**

- `packages/ui/auth.ts` — NextAuth config with GoogleProvider + domain allowlist callback
- `packages/ui/middleware.ts` — Route protection with public path exceptions (`/login`, `/api/auth/**`)
- `packages/ui/providers/auth-provider.tsx` — `SessionProvider` wrapper (Client Component)
- `packages/ui/app/(public)/login/page.tsx` — Login page with sign-in button
- `packages/ui/app/api/auth/[...nextauth]/route.ts` — NextAuth API route handler

**Required env vars** (add to `.env.local`):
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

**Install dependency:**
```bash
bun add next-auth
```

Wrap `app/layout.tsx` body with `<AuthProvider>`. Protect all routes except `/login` and `/api/auth/**` in middleware.

See `references/auth.md` for complete file contents including multi-domain allowlist pattern.

## Package Setup

```
packages/ui/
├── src/
│   └── app/
│       ├── layout.tsx         # Root layout with sidebar/nav
│       ├── page.tsx           # Dashboard home
│       ├── [feature]/
│       │   └── page.tsx       # Feature pages
│       ├── actions/           # Server Actions
│       │   └── [resource].ts
│       └── components/        # App-specific components
│           ├── ui/            # shadcn/ui components (managed by CLI)
│           └── [feature]/     # Feature-specific components
├── components.json            # shadcn/ui config
├── postcss.config.mjs         # Tailwind CSS v4 via @tailwindcss/postcss
├── next.config.ts
├── package.json
└── tsconfig.json
```

**package.json** must include:
```json
{
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build"
  },
  "dependencies": {
    "next": "^16",
    "react": "^19",
    "react-dom": "^19",
    "@repo/types": "workspace:*",
    "tailwindcss": "^4",
    "@tailwindcss/postcss": "^4",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "lucide-react": "latest"
  }
}
```

## Data Fetching Pattern — Server Components

Data loading happens directly in async Server Components. No hooks, no client fetching:

```typescript
// app/items/page.tsx — Server Component by default, no "use client" needed
import { ItemsTable } from "@/components/items/items-table";

export default async function ItemsPage() {
  const res = await fetch("http://localhost:3001/api/items", {
    cache: "no-store",
  });
  const items = await res.json();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Items</h1>
      <ItemsTable items={items} />
    </div>
  );
}
```

## Mutation Pattern — Server Actions

All mutations use Server Actions defined in `app/actions/`:

```typescript
// app/actions/items.ts
"use server";

import { revalidatePath } from "next/cache";

export async function createItem(formData: FormData) {
  const name = formData.get("name") as string;
  await fetch("http://localhost:3001/api/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  revalidatePath("/items");
}

export async function deleteItem(id: string) {
  await fetch(`http://localhost:3001/api/items/${id}`, { method: "DELETE" });
  revalidatePath("/items");
}
```

Using Server Actions in components:

```typescript
// components/items/create-item-form.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createItem } from "@/app/actions/items";

export function CreateItemForm() {
  return (
    <form action={createItem} className="flex gap-2">
      <Input name="name" placeholder="Item name" required />
      <Button type="submit">Create</Button>
    </form>
  );
}
```

## Dashboard Layout Pattern

**Preferred**: Install the full shadcn sidebar block:

```bash
npx shadcn@latest add sidebar-01
```

This installs the complete `sidebar-01` block from [ui.shadcn.com/blocks/sidebar](https://ui.shadcn.com/blocks/sidebar), including all sub-components, styles, and layout wrapper. Customize the nav items after installation.

**Fallback** (if block install is not appropriate): Use the manual pattern below.

```typescript
// app/layout.tsx
import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu,
         SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { LayoutDashboard, Settings, Info } from "lucide-react";
import Link from "next/link";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SidebarProvider>
          <div className="flex min-h-screen">
            <Sidebar>
              <SidebarContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/about"><Info className="mr-2 h-4 w-4" />About</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarContent>
            </Sidebar>
            <main className="flex-1 p-6">{children}</main>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
```

## Mandatory About Page

Every app MUST include an `/about` route. Scaffold it during initial setup:

```typescript
// app/about/page.tsx — Server Component
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Info className="h-6 w-6" /> About
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>[Project Name]</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p>[Brief description of what this prototype does]</p>
          <p className="text-sm">Built with the prototyping-skills stack.</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

Add the About link to the sidebar layout alongside Dashboard and Settings.

## Design Token Conventions

Use shadcn/ui's CSS custom properties (design tokens) to separate content from style.
Never hard-code colors, spacing, or font sizes.

**Do:**
```tsx
<p className="text-muted-foreground">Subtle text</p>
<div className="bg-card border-border rounded-lg p-4">Card</div>
<span className="text-destructive">Error</span>
```

**Don't:**
```tsx
<p className="text-gray-500">Subtle text</p>
<div className="bg-white border-gray-200 rounded-lg p-4">Card</div>
<span className="text-red-600">Error</span>
```

**Token reference** (use these, not raw Tailwind colors):
- Backgrounds: `bg-background`, `bg-card`, `bg-popover`, `bg-muted`
- Foreground: `text-foreground`, `text-muted-foreground`, `text-card-foreground`
- Borders: `border-border`, `border-input`
- Interactive: `bg-primary`, `bg-secondary`, `bg-accent`, `bg-destructive`
- Spacing: Use Tailwind scale (`p-4`, `gap-6`, `space-y-4`) — don't invent custom spacing

## Component Conventions

- **shadcn/ui for all standard UI elements.** Install via `bunx shadcn@latest add [component]`.
- **Dashboard pages**: Title + description at top, data table or card grid below.
- **Data tables**: shadcn/ui `<Table>` or `@tanstack/react-table` with shadcn styling when sorting/filtering is needed.
- **Charts**: `recharts` with shadcn chart wrapper (`ChartContainer`, `ChartTooltip`) when data visualisation is needed. See `references/charts.md` for BarChart, LineChart, and PieChart patterns.
- **Loading states**: `loading.tsx` files (Next.js Suspense boundaries), not spinner state variables.
- **Error states**: `error.tsx` files per route segment.

## Accessibility (WCAG 2.1 AA)

All scaffolded UIs must meet WCAG 2.1 AA. Apply these rules during generation:

- **Color contrast**: Minimum 4.5:1 for normal text, 3:1 for large text (≥18pt or ≥14pt bold). Use shadcn tokens — they are pre-tested.
- **Keyboard navigation**: Every interactive element (buttons, links, inputs, dropdowns) must be reachable via `Tab` in logical order.
- **ARIA labels**: Required on icon-only buttons (`aria-label="Delete item"`) and form inputs without visible labels (`aria-label` or `aria-labelledby`).
- **Semantic HTML**: Use `<nav>`, `<main>`, `<header>`, `<aside>` for structural regions — never `<div>` for everything.
- **Focus visible**: Never apply `outline: none` without replacing it with a custom visible focus indicator. shadcn uses `focus-visible:ring` — keep it.
- **Alt text**: All `<img>` elements need descriptive `alt` text. Decorative images use `alt=""`.
- **shadcn/radix handles primitives**: Radix UI manages ARIA roles, `aria-expanded`, `aria-haspopup`, keyboard interactions on dropdowns/dialogs. Do not override radix ARIA attributes.

## Client vs Server Component Decision

Ask: "Does this component need `useState`, `useEffect`, event handlers, or browser APIs?"
- **No** — Keep as Server Component (default, no directive needed)
- **Yes** — Add `"use client"` at the top

Common pattern: Server Component fetches data, passes it to a Client Component for interactivity.

## Styling Conventions

- **Tailwind CSS v4 only.** No CSS modules, no styled-components, no inline style objects.
- **No `tailwind.config.ts`** — Tailwind v4 configures everything in CSS via `globals.css`:
  - `@import "tailwindcss"` replaces `@tailwind base/components/utilities`
  - `@plugin` directives replace the `plugins: []` array
  - `@theme inline` maps CSS custom properties to Tailwind utility classes
- **`@tailwindcss/postcss`** is the PostCSS plugin (in `postcss.config.mjs`). Autoprefixer is included — do not add it separately.
- Use the `cn()` utility (from `lib/utils.ts`) for conditional classes.
- Stick to shadcn/ui's design tokens and default theme.
- Dark mode: use `class` strategy with shadcn's built-in dark mode support.

## Verification Checklist

After scaffolding pages, create this task to visually confirm the app renders correctly:

```
TaskCreate({
  subject: "Verify UI renders with Puppeteer",
  description: "1. Start dev server: bun dev (in packages/ui)\n2. Navigate to http://localhost:3000\n3. Take a screenshot and confirm: sidebar visible, main content area renders, no console errors\n4. If auth is enabled: confirm redirect to /login when unauthenticated\n5. Sign in and confirm protected routes load"
})
```
