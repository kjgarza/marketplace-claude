# Add Playwright fallback to event-scout + convert scripts to TypeScript

## Context

`plugins/berlin-events/scripts/extract-content.js` is a simple `fetch` + JSDOM + Mozilla Readability pipeline. It cannot run page JavaScript, so sources flagged in `skills/event-sources/references/sources.md` as failing — **tip-berlin.de**, **berlinerfestspiele.de/gropius-bau**, **mitvergnuegen.com** — yield empty or consent-only extractions. Today the agent at `plugins/berlin-events/agents/event-scout.md` simply falls back to `WebFetch`/`WebSearch` when the script fails, which is lossy.

Goal: add a Playwright-based fallback that handles JS-rendered, lazy-loaded, and cookie-gated pages, with **source-specific extractors that return structured `Event[]` JSON directly** for the three known-bad sources. Keep Readability as the fast default. Convert the scripts to TypeScript so the source registry, the `Event` schema, and the extractor signatures are typed end-to-end. Drive everything off a single typed `sources.ts` registry so `test-pipeline.sh`, the `find-events` skill, and the `event-scout` agent all agree on what runs where.

Cascade order (per source):
1. API/RSS (if configured)
2. `extract-content.ts` (fetch + Readability — fast)
3. `render-content.ts` (Playwright + Readability — generic JS fallback)
4. Source-specific extractor in `extractors/<slug>.ts` (Playwright + DOM → typed `Event[]`)
5. `WebFetch` / `WebSearch` (agent fallback)

## Files to create

All under `plugins/berlin-events/scripts/`. Bun runs `.ts` natively; no `tsconfig.json` is needed (matches `plugins/readitlater-digest/scripts/*.ts` convention).

### `types.ts`
Single source of truth for the schema the agent already documents in `agents/event-scout.md`.

```ts
export interface Event {
  name: string;
  date: string;            // YYYY-MM-DD
  time?: string;           // HH:MM
  end_time?: string;
  venue: string;
  neighborhood?: string;
  category: "art" | "food";
  description: string;
  url: string;
  source: string;
}
```

### `sources.ts`
Typed registry. Replaces ad-hoc hardcoded URL lists in `test-pipeline.sh` and the prose source list in `skills/find-events/SKILL.md` Step 3.

```ts
import type { Page } from "playwright";
import type { Event } from "./types";

export type ExtractionStrategy =
  | { kind: "readability" }
  | { kind: "playwright"; waitFor?: string }
  | { kind: "source-extractor"; module: string; waitFor: string };

export interface SourceConfig {
  slug: string;
  name: string;
  url: string;
  category: "art" | "food" | "art,food";
  extraction: ExtractionStrategy;
}

export const SOURCES: SourceConfig[] = [
  // Readability-friendly (current working set)
  { slug: "kw-berlin",        name: "KW Institute",       url: "https://www.kw-berlin.de/en/events",
    category: "art", extraction: { kind: "readability" } },
  { slug: "indexberlin",      name: "INDEX Berlin",       url: "https://www.indexberlin.com/events/list/",
    category: "art", extraction: { kind: "readability" } },
  // ... remaining priority sources from references/sources.md

  // JS-rendered — wired now
  { slug: "tip-berlin",       name: "Tip Berlin",         url: "https://www.tip-berlin.de/event/",
    category: "art,food",
    extraction: { kind: "source-extractor", module: "./extractors/tip-berlin", waitFor: "article, .event-card" } },
  { slug: "gropius-bau",      name: "Gropius Bau",        url: "https://www.berlinerfestspiele.de/gropius-bau",
    category: "art",
    extraction: { kind: "source-extractor", module: "./extractors/gropius-bau", waitFor: "article, .event, .program" } },
  { slug: "mitvergnuegen",    name: "Mit Vergnügen",      url: "https://mitvergnuegen.com/berlin/",
    category: "food",
    extraction: { kind: "source-extractor", module: "./extractors/mitvergnuegen", waitFor: "article" } },
];

export function findSource(urlOrSlug: string): SourceConfig | undefined {
  return SOURCES.find(s => s.slug === urlOrSlug || s.url === urlOrSlug);
}
```

### `extract-content.ts`
Direct TS port of the existing `extract-content.js`. Same fetch/Readability behavior, same `--json` flag. Replaces — not parallels — the JS file (delete `extract-content.js` in the same commit).

### `render-content.ts`
Generic Playwright + Readability fallback. Matches the skeleton in the user's brief, in TS:
- Launch chromium headless, German locale, Berlin timezone, realistic UA.
- Block `image`/`font`/`media` via `page.route` for speed.
- `page.goto(url, { waitUntil: "domcontentloaded" })` (avoid `networkidle` per Playwright docs).
- Best-effort cookie banner click (English + German labels).
- If `--selector=` given, `locator(sel).first().waitFor({ state: "visible" })`.
- Scroll a few times to trigger lazy loading.
- Run Readability over `page.content()`, print text or JSON.

### `extractors/tip-berlin.ts`, `extractors/gropius-bau.ts`, `extractors/mitvergnuegen.ts`
Source-specific structured extractors. Each exports:

```ts
import type { Page } from "playwright";
import type { Event } from "../types";
export async function extract(page: Page): Promise<Event[]> { /* ... */ }
```

Each maps DOM cards to typed `Event` objects (parse German dates like `So, 14.06.2026, 19:00`, derive `venue` from card text or known constant, set `source` and `category` from the source config, leave fields it can't confidently fill `undefined`). Selectors should be inspected live during implementation — do not hard-code from this plan.

### `extract-events.ts`
Dispatcher. Looks up the source in `SOURCES`, dynamically `import()`s the extractor module, opens a shared Playwright `Page` (shared cookie-dismiss + scroll helpers from `render-content.ts`), runs `extract(page)`, prints `JSON.stringify(events)`. For `extraction.kind === "readability"` / `"playwright"`, defers to the simpler scripts.

```bash
bun run extract-events.ts <url-or-slug>
# → [{"name":"...", "date":"2026-06-14", ...}, ...]
```

### `list-sources.ts`
Bridge so `test-pipeline.sh` (bash) can iterate the typed registry without parsing TS:

```bash
bun run list-sources.ts
# slug<TAB>url<TAB>category<TAB>extraction_kind
```

Used by `test-pipeline.sh` in a `while read` loop.

## Files to modify

### `plugins/berlin-events/scripts/package.json`
Add `playwright` runtime + `@types/jsdom` for typing. Keep `"type": "module"`.

```json
{
  "name": "berlin-events-scripts",
  "private": true,
  "type": "module",
  "dependencies": {
    "@mozilla/readability": "^0.5.0",
    "jsdom": "^25.0.0",
    "playwright": "^1.0.0"
  },
  "devDependencies": {
    "@types/jsdom": "^21.0.0"
  }
}
```

Post-install setup (one-time, documented in README / agent doc):
```bash
cd plugins/berlin-events/scripts && bun install && bunx playwright install chromium
```

### `plugins/berlin-events/scripts/test-pipeline.sh`
Replace the hardcoded 9-URL list with a loop over `list-sources.ts` output, routing each source through `extract-events.ts` (which itself dispatches by `extraction.kind`). Output is still piped to `qurl add`. Keep the acceptance loop (embed → vsearch → keyword count) untouched so DOD.md thresholds still apply.

### `plugins/berlin-events/agents/event-scout.md`
Update the "Research Process" section to describe the new cascade:
1. If source has API/RSS — use it.
2. `bun run ${CLAUDE_PLUGIN_ROOT}/scripts/extract-events.ts "<url-or-slug>"` (dispatcher handles strategy).
3. If output is too short / consent-only / missing date keywords (see heuristic below) → re-run with `--force-playwright`.
4. If still empty → `WebFetch`/`WebSearch`.

Add the bad-extraction heuristic verbatim from the user's brief (`extractionLooksBad`) as a short bash check inside the agent doc — length < 800 chars, or "cookie+consent" with no event/date keywords.

Update the `tools:` line to keep `Bash, Read, WebSearch, WebFetch, Grep` (no new tools needed).

### `plugins/berlin-events/skills/find-events/SKILL.md`
Step 3 ("Ingest Sources into qurl"): drop the inline 8-URL list, replace with a loop over `list-sources.ts` calling `extract-events.ts`. Update the `BUN=$(command -v bun ...)` resolution to match the readitlater-digest convention (`/home/user/marketplace-claude/plugins/readitlater-digest/skills/digest/SKILL.md:36-44`).

### `plugins/berlin-events/skills/event-sources/SKILL.md`
Add a "Source registry (machine-readable)" section pointing at `scripts/sources.ts` as the canonical extraction-routing source. The existing `references/sources.md` stays as the human-readable directory but gets a one-line note that `sources.ts` is now authoritative for *what to run*.

### `plugins/berlin-events/.gitignore`
Append:
```
scripts/.playwright/
scripts/playwright-report/
```

## Conventions to follow

Matches `plugins/readitlater-digest/scripts/*.ts`:
- `#!/usr/bin/env bun` shebang on every executable script.
- `if (import.meta.main) { ... }` for CLI entry points; main logic in exported named functions.
- `parseArgs` from Node `util` for CLI flags.
- No `tsconfig.json`, no `tsx`/`bunx run` — invoke with `$BUN run path/to/script.ts`.
- Bun resolution in shell: `BUN=$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")`.

## Verification

1. **Install**: `cd plugins/berlin-events/scripts && bun install && bunx playwright install chromium` — both succeed.
2. **Readability path unchanged**: `bun run extract-content.ts https://www.kw-berlin.de/en/events` produces the same clean text as the current JS version.
3. **Generic Playwright fallback**: `bun run render-content.ts https://www.tip-berlin.de/event/ --selector="article" --json` returns non-empty `textContent` (length > 800).
4. **Source-specific extractors**: for each of `tip-berlin`, `gropius-bau`, `mitvergnuegen`:
   ```bash
   bun run extract-events.ts <slug> | jq 'length, .[0]'
   ```
   returns ≥1 event with at least `name`, `date`, `url`, `source` populated.
5. **Dispatcher routing**: `bun run extract-events.ts kw-berlin` uses Readability (no chromium launch — verify with `--verbose` log line); `bun run extract-events.ts tip-berlin` launches chromium.
6. **Bash bridge**: `bun run list-sources.ts | head` prints TSV; `bash scripts/test-pipeline.sh` runs end-to-end, ingests ≥3 sources, prints `relevant_results: N` with N≥5 (DOD.md threshold).
7. **Agent integration**: invoke the `event-scout` agent manually with one Readability URL and one tip-berlin URL; confirm both paths return structured events without falling through to `WebSearch`.
8. **Type sanity**: `bunx tsc --noEmit --allowImportingTsExtensions --module esnext --moduleResolution bundler scripts/*.ts scripts/extractors/*.ts` reports no errors. (One-shot check, not committed as part of CI.)
