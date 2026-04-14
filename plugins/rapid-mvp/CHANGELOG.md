# Changelog

## v0.3.0 — Next.js 16 migration (2026-04-14)

### Changed

- **Next.js 15 → 16**: Updated version table, dependency references, and all patterns to target Next.js 16.x
- **`next.config.js` → `next.config.ts`**: Config template converted from CommonJS to ESM/TypeScript. Uses `import type { NextConfig }` and `export default`. CJS interop for `next-pwa` handled by Next.js 16's TS config loader.
- **`postcss.config.js` → `postcss.config.mjs`**: PostCSS config converted from CommonJS to ESM (`export default`).
- **Turbopack is default**: Removed `--webpack` anti-pattern note (already gone in 15.5+). Added `--turbopack` flag anti-pattern — the flag is unnecessary in Next.js 16 as Turbopack is the default bundler.
- **ESLint config packages**: Bumped `@next/eslint-plugin-next` and `eslint-config-next` from `^15.0.0` to `^16.0.0`.

---

## v0.2.0 — Lessons from explinearoja (2026-03-21)

Changes based on real-world usage of the plugin in the explinearoja project.

### Fixed

- **Tailwind v3 → v4 migration**: Removed `tailwind.config.ts` template, replaced with Tailwind CSS v4 patterns (`@import "tailwindcss"`, `@plugin`, `@theme inline`, `@source`, `@tailwindcss/postcss`). No JS config file.
- **Removed `--webpack` flag**: Next.js 15.5 removed this option. Turbopack is now the default dev server. next-pwa is disabled during dev, so no conflict.
- **Fixed `components.json`**: Removed `config: "tailwind.config.ts"` field — not used in v4.
- **Fixed `postcss.config.js`**: Uses `@tailwindcss/postcss` instead of `tailwindcss` + `autoprefixer`.

### Added

- **GitHub Actions workflow for Next.js**: Deploys to GitHub Pages via static export with Bun. Sets `NEXT_PUBLIC_REPO_NAME` automatically.
- **GitHub Pages support in `next.config.js`**: `output: "export"`, `basePath`, `assetPrefix`, `images: { unoptimized: true }`.
- **Open Graph metadata**: Root layout template includes OG/Twitter meta with static `opengraph.png`, dynamic `metadataBase` for GitHub Pages.
- **basePath helper pattern**: Documentation for prefixing image paths with basePath in components.
- **Font system**: Inter (body) + Space Grotesk (headings) via `next/font/google` with CSS variable mode.
- **Required dependencies list**: Explicit list of packages to install for a Next.js app.

### Changed

- **Default hosting**: GitHub Pages (both stacks) instead of Vercel for Next.js. Deviate to Vercel only when SSR/edge functions are needed.
- **Architecture decisions**: Updated `--webpack` reference, hosting default, CLAUDE.md guidance.

---

## v0.1.0 — Initial release

Original plugin based on Opus recommendations. See git history for details.

### Original design notes

- Plugin pattern chosen over template repos because knowledge is cross-project
- Two stack skills (nextjs, 11ty) + shared-packages + architecture-decisions
- `/start-project` command with AskUserQuestion and TaskCreate
- Auto-generated CITATION.cff and LICENSE
- About page requirement with Typography
- Data/format separation enforced in both stacks
- Design tokens via shared `tooling/theme.css`
