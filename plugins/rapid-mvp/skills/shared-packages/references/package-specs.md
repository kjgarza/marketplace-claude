# Package Specifications Reference

Detailed package.json, tsconfig, and build configurations for all shared packages.

## @repo/utils

### package.json

```json
{
  "name": "@repo/utils",
  "version": "0.0.0",
  "private": true,
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "bun test",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@repo/tsconfig": "workspace:*",
    "tsup": "^8.0.0",
    "typescript": "^5.6.0"
  }
}
```

### tsup.config.ts

```ts
import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
})
```

### src/index.ts

```ts
export { cn } from "./cn"
export type * from "./types"
export * from "./validation-schemas"
```

### src/cn.ts

```ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### src/types.ts

```ts
// Shared type definitions — add project-specific types here
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }
export type Prettify<T> = { [K in keyof T]: T[K] } & {}
```

### src/validation-schemas.ts

```ts
import { z } from "zod"

// Add shared Zod schemas here
// Example: email schema used across apps
export const emailSchema = z.string().email("Invalid email address")
```

## @repo/tsconfig

### base.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "isolatedModules": true
  },
  "exclude": ["node_modules"]
}
```

### app.json

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### package.json

```json
{
  "name": "@repo/tsconfig",
  "version": "0.0.0",
  "private": true,
  "files": ["base.json", "app.json"]
}
```

## @repo/ui

### package.json

```json
{
  "name": "@repo/ui",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.3.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "@radix-ui/react-label": "^2.0.0",
    "@radix-ui/react-popover": "^1.0.0",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.0",
    "@radix-ui/react-slot": "^1.0.0",
    "@radix-ui/react-switch": "^1.0.0",
    "@radix-ui/react-tabs": "^1.0.0",
    "@radix-ui/react-tooltip": "^1.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.400.0",
    "react-hook-form": "^7.53.0",
    "recharts": "^2.15.0",
    "sonner": "^2.0.0",
    "tailwind-merge": "^2.5.0"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@repo/tsconfig": "workspace:*",
    "tsup": "^8.0.0",
    "typescript": "^5.6.0"
  }
}
```

### src/index.ts

Re-export all installed shadcn/ui components:

```ts
// Add components as they are installed via shadcn CLI
export * from "./button"
export * from "./card"
export * from "./input"
export * from "./form"
export * from "./label"
export * from "./dialog"
export * from "./select"
export * from "./tabs"
// ... add more as needed
```

### Adding new shadcn components

Always run from the `packages/ui/` directory:

```bash
cd packages/ui && bunx shadcn@latest add <component-name>
```

Then add the export to `src/index.ts`.

## @repo/eslint-config

### package.json

```json
{
  "name": "@repo/eslint-config",
  "version": "0.0.0",
  "private": true,
  "main": "next.js",
  "dependencies": {
    "@next/eslint-plugin-next": "^15.0.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-config-next": "^15.0.0"
  }
}
```

### next.js

```js
module.exports = {
  extends: ["next/core-web-vitals", "prettier"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "react/jsx-key": "off",
  },
}
```

## Pipeline Package Template

When the MVP needs data transformation:

### package.json

```json
{
  "name": "@repo/pipeline",
  "version": "0.0.0",
  "private": true,
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@repo/tsconfig": "workspace:*",
    "tsup": "^8.0.0",
    "typescript": "^5.6.0"
  }
}
```

### src/index.ts

```ts
export { fetchData } from "./fetcher"
export { transformData } from "./transformer"
export type * from "./types"
```

## tooling/theme.css (Shared Design Tokens)

Both stacks import this file for visual consistency. Uses OKLCH color space with Tailwind CSS 4 `@theme` directive.

```css
/* tooling/theme.css — shared OKLCH design tokens */

@theme {
  /* Neutral palette */
  --color-neutral-50: oklch(0.985 0 0);
  --color-neutral-100: oklch(0.97 0.001 106.42);
  --color-neutral-200: oklch(0.922 0.004 106.42);
  --color-neutral-300: oklch(0.87 0.006 106.42);
  --color-neutral-400: oklch(0.708 0.01 106.42);
  --color-neutral-500: oklch(0.553 0.013 106.42);
  --color-neutral-600: oklch(0.442 0.011 106.42);
  --color-neutral-700: oklch(0.371 0.01 106.42);
  --color-neutral-800: oklch(0.269 0.006 106.42);
  --color-neutral-900: oklch(0.205 0.006 106.42);
  --color-neutral-950: oklch(0.145 0.004 106.42);

  /* Primary accent — customize per project */
  --color-primary-400: oklch(0.7 0.15 250);
  --color-primary-500: oklch(0.6 0.18 250);
  --color-primary-600: oklch(0.5 0.18 250);

  /* Typography */
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  /* Spacing scale */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 2rem;
  --spacing-xl: 4rem;

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
}
```

## CITATION.cff Template

```yaml
cff-version: 1.2.0
title: "Project Name"
message: "If you use this project, please cite it using the metadata from this file."
type: software
authors:
  - given-names: Kristian
    family-names: Garza
    orcid: "https://orcid.org/0000-0003-3484-6875"
license: CC-BY-NC-ND-4.0
```

## LICENSE Template (MIT)

```
MIT License

Copyright (c) 2026 Kristian Garza

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## justfile Template

```makefile
# Project task runner

# Core commands
install:
    bun install

dev:
    bun run dev

build:
    bun run build

lint:
    bun run lint

type-check:
    bun run type-check

clean:
    bun run clean

# Git helpers
status:
    git status

commit message:
    git add -A && git commit -m "{{message}}"

push:
    git push

# Package development
dev-ui:
    cd packages/ui && bun run dev

# Add app-specific commands as needed
```
