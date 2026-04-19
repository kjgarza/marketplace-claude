# Next.js Patterns Reference

Detailed file templates and configuration patterns for Next.js MVP projects.

## next.config.ts Template

```ts
import type { NextConfig } from "next"
import withPWA from "next-pwa"

const repoName = process.env.NEXT_PUBLIC_REPO_NAME
const isGitHubPages = !!repoName

const nextConfig: NextConfig = {
  output: isGitHubPages ? "export" : undefined,
  images: isGitHubPages ? { unoptimized: true } : undefined,
  basePath: isGitHubPages ? `/${repoName}` : "",
  assetPrefix: isGitHubPages ? `/${repoName}/` : undefined,
  transpilePackages: ["@repo/utils", "@repo/ui"],
}

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    { urlPattern: /^https:\/\/fonts/, handler: "StaleWhileRevalidate", options: { cacheName: "google-fonts", expiration: { maxEntries: 10, maxAgeSeconds: 604800 } } },
    { urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/, handler: "CacheFirst", options: { cacheName: "images", expiration: { maxEntries: 64, maxAgeSeconds: 86400 } } },
    { urlPattern: /\/api\//, handler: "NetworkFirst", options: { cacheName: "api", networkTimeoutSeconds: 10 } }
  ]
})(nextConfig)
```

Key points:
- `output: "export"` produces a static site for GitHub Pages
- `images: { unoptimized: true }` is required for static export (no image optimization server)
- `basePath` and `assetPrefix` prefix all routes and assets with the repo name
- `NEXT_PUBLIC_REPO_NAME` is set by the GitHub Actions workflow at build time
- next-pwa is disabled during development, so Turbopack (the default dev server) works fine — no `--turbopack` or `--webpack` flag needed
- Next.js 16 uses `next.config.ts` by default — CJS interop for plugins like `next-pwa` is handled automatically

## postcss.config.mjs Template (Tailwind CSS v4)

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}
```

Tailwind CSS v4 uses `@tailwindcss/postcss` as a PostCSS plugin. Autoprefixer is included automatically — do not add it separately. Do NOT create a `tailwind.config.ts` file — v4 configures everything in CSS.

## globals.css Template (Tailwind CSS v4)

```css
@import "tailwindcss";

/* Include shadcn/ui components from monorepo packages */
@source "../../../../packages/ui/src";

/* Tailwind plugins — declared as CSS directives in v4 */
@plugin "tailwindcss-animate";
@plugin "@tailwindcss/typography";

/* shadcn/ui theme variables mapped to Tailwind utilities via @theme inline */
@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-chart-1: hsl(var(--chart-1));
  --color-chart-2: hsl(var(--chart-2));
  --color-chart-3: hsl(var(--chart-3));
  --color-chart-4: hsl(var(--chart-4));
  --color-chart-5: hsl(var(--chart-5));
  --color-sidebar: hsl(var(--sidebar));
  --color-sidebar-foreground: hsl(var(--sidebar-foreground));
  --color-sidebar-primary: hsl(var(--sidebar-primary));
  --color-sidebar-primary-foreground: hsl(var(--sidebar-primary-foreground));
  --color-sidebar-accent: hsl(var(--sidebar-accent));
  --color-sidebar-accent-foreground: hsl(var(--sidebar-accent-foreground));
  --color-sidebar-border: hsl(var(--sidebar-border));
  --color-sidebar-ring: hsl(var(--sidebar-ring));
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

/* Custom font variables — set in layout.tsx via next/font */
@theme inline {
  --font-sans: var(--font-inter), system-ui, sans-serif;
  --font-heading: var(--font-space-grotesk), system-ui, sans-serif;
}

/* Base theme CSS custom properties */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
  --chart-1: 12 76% 61%;
  --chart-2: 173 58% 39%;
  --chart-3: 197 37% 24%;
  --chart-4: 43 74% 66%;
  --chart-5: 27 87% 67%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;
  --chart-1: 220 70% 50%;
  --chart-2: 160 60% 45%;
  --chart-3: 30 80% 55%;
  --chart-4: 280 65% 60%;
  --chart-5: 340 75% 55%;
}
```

Key v4 changes from v3:
- `@import "tailwindcss"` replaces `@tailwind base/components/utilities`
- `@plugin` directives replace the `plugins: []` array in config
- `@theme inline` maps CSS custom properties to Tailwind utility classes
- `@source` tells Tailwind where to scan for class usage (monorepo packages)
- No `tailwind.config.ts` file — everything is in CSS
- No `@layer base` wrapper needed for theme variables
- Custom fonts declared via `--font-sans` and `--font-heading` in `@theme inline`

## Root Layout Template

```tsx
import type { Metadata } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
})

const repoName = process.env.NEXT_PUBLIC_REPO_NAME
const siteUrl = repoName
  ? `https://<github-username>.github.io/${repoName}`
  : "https://example.com"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "App Name",
    template: "%s | App Name",
  },
  description: "App description",
  openGraph: {
    title: "App Name",
    description: "App description",
    url: siteUrl,
    siteName: "App Name",
    images: [
      {
        url: "/opengraph.png",
        width: 1200,
        height: 630,
        alt: "App Name",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "App Name",
    description: "App description",
    images: ["/opengraph.png"],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

Key points:
- Use `variable` mode for fonts so they work with Tailwind's `--font-*` system
- `metadataBase` dynamically supports GitHub Pages deployment via `NEXT_PUBLIC_REPO_NAME`
- Static `/opengraph.png` (1200x630) in `public/` — avoid dynamic OG image generation for static exports
- Replace `<github-username>` with the actual GitHub username at scaffold time

## Open Graph Image

Place a static `opengraph.png` (1200x630px) in `public/`. Do NOT use dynamic `opengraph-image.tsx` or `twitter-image.tsx` route handlers — these are incompatible with `output: "export"` (static builds).

## basePath Helper for Images

When deploying to GitHub Pages, all image paths in components must be prefixed with basePath. Use this pattern:

```tsx
// In server components — read from env at render time
const basePath = process.env.NEXT_PUBLIC_REPO_NAME
  ? `/${process.env.NEXT_PUBLIC_REPO_NAME}`
  : ""

// Usage in JSX
<Image src={`${basePath}/logos/logo.svg`} alt="Logo" width={120} height={40} />
```

For Next.js `<Image>` component: always use unoptimized mode when targeting GitHub Pages (`images: { unoptimized: true }` in next.config.ts).

For `<a>` tags instead of `<Link>`: when basePath is set, Next.js `<Link>` automatically prepends it. But if you use plain `<a>` tags (e.g., for external links or anchors), you must manually prepend basePath.

## ThemeProvider Component

```tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

## components.json (shadcn/ui config for v4)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@repo/utils",
    "ui": "@repo/ui"
  }
}
```

Note: No `config` field in `tailwind` — Tailwind CSS v4 does not use a JS config file.

## Form Pattern (React Hook Form + Zod)

```tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@repo/ui"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui"
import { Input } from "@repo/ui"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
})

type FormValues = z.infer<typeof formSchema>

export function ExampleForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "" },
  })

  function onSubmit(values: FormValues) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

## tsconfig.json (app-level)

```json
{
  "extends": "@repo/tsconfig/app.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
    "allowJs": true,
    "noEmit": true,
    "incremental": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## GitHub Actions Deploy (Next.js to GitHub Pages)

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - run: bun install --frozen-lockfile

      - name: Build
        run: bun run build
        env:
          NEXT_PUBLIC_REPO_NAME: ${{ github.event.repository.name }}

      - uses: actions/configure-pages@v5

      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./apps/<app-name>/out

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Replace `<app-name>` with the actual app directory name at scaffold time. The `NEXT_PUBLIC_REPO_NAME` env var is automatically set from the GitHub repo name and consumed by `next.config.ts` for basePath/assetPrefix.

To enable: go to repo Settings > Pages > Source > "GitHub Actions".

## About Page Pattern

### src/content/about.ts

```ts
export const about = {
  motivations: "Describe why this project exists.",
  principles: [
    "Principle one",
    "Principle two",
    "Principle three",
  ],
  howBuilt: "Describe the tools and approach used to build this project.",
}
```

### src/app/about/page.tsx

```tsx
import { about } from "@/content/about"

export default function AboutPage() {
  return (
    <article className="prose prose-lg mx-auto max-w-3xl px-4 py-12">
      <h1>About</h1>

      <h2>Motivations</h2>
      <p>{about.motivations}</p>

      <h2>Design Principles</h2>
      <ul>
        {about.principles.map((principle) => (
          <li key={principle}>{principle}</li>
        ))}
      </ul>

      <h2>How It Was Built</h2>
      <p>{about.howBuilt}</p>
    </article>
  )
}
```

This pattern separates content data (`src/content/about.ts`) from presentation (`src/app/about/page.tsx`). Use `.ts` for type safety and computed values, or `.json` for simplicity.

## PWA Manifest Template

```json
{
  "name": "App Name",
  "short_name": "App",
  "description": "App description",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

## Required Dependencies (Next.js app)

When scaffolding a Next.js app, install these packages:

```bash
bun add next react react-dom next-pwa next-themes @tailwindcss/postcss@4 tailwindcss@4 tailwindcss-animate @tailwindcss/typography
```

Note: `@tailwindcss/postcss@4` is the v4 PostCSS integration. Do NOT install `autoprefixer` separately — it's included in v4.
