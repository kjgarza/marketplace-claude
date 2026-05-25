#!/usr/bin/env bun
/**
 * Dispatcher: routes a source URL or slug through the right extraction
 * strategy declared in sources.ts.
 *
 *  - readability        → fetch + Readability (fast path)
 *  - playwright         → render with chromium + Readability (generic fallback)
 *  - source-extractor   → render with chromium + per-source extract() → Event[]
 *
 * Usage:
 *   bun run extract-events.ts <url-or-slug> [--force-playwright] [--text]
 *
 * Output:
 *   - For source-extractor strategy: JSON array of Event objects.
 *   - For readability/playwright: plain text (default) or JSON with
 *     {url, title, textContent} when --json is set.
 */

import { findSource, type SourceConfig } from "./sources.ts";
import { extractReadable } from "./extract-content.ts";
import {
  newBerlinContext,
  openBrowser,
  dismissCookieBanner,
  scrollToLoad,
  renderAndExtract,
} from "./render-content.ts";
import type { Event } from "./types.ts";

async function runSourceExtractor(
  source: SourceConfig,
  modulePath: string,
  waitFor: string,
): Promise<Event[]> {
  const browser = await openBrowser();
  try {
    const context = await newBerlinContext(browser);
    const page = await context.newPage();
    await page.goto(source.url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await dismissCookieBanner(page);
    await page
      .locator(waitFor)
      .first()
      .waitFor({ state: "visible", timeout: 15_000 })
      .catch(() => {});
    await scrollToLoad(page, 6);

    const mod = (await import(modulePath)) as {
      extract: (page: import("playwright").Page) => Promise<Event[]>;
    };
    if (typeof mod.extract !== "function") {
      throw new Error(`Extractor ${modulePath} has no exported extract(page)`);
    }
    return await mod.extract(page);
  } finally {
    await browser.close();
  }
}

async function dispatch(
  source: SourceConfig,
  forcePlaywright: boolean,
  wantJson: boolean,
): Promise<void> {
  if (!forcePlaywright && source.extraction.kind === "readability") {
    const article = await extractReadable(source.url);
    if (!article) {
      console.error("Readability returned nothing.");
      process.exit(1);
    }
    if (wantJson) {
      console.log(JSON.stringify(article, null, 2));
    } else {
      if (article.title) console.log(`# ${article.title}\n`);
      console.log(article.textContent);
    }
    return;
  }

  if (forcePlaywright || source.extraction.kind === "playwright") {
    const waitFor =
      source.extraction.kind === "playwright"
        ? source.extraction.waitFor
        : undefined;
    const rendered = await renderAndExtract(source.url, { selector: waitFor });
    if (wantJson) {
      console.log(JSON.stringify(rendered, null, 2));
    } else {
      if (rendered.title) console.log(`# ${rendered.title}\n`);
      console.log(rendered.textContent);
    }
    return;
  }

  if (source.extraction.kind === "source-extractor") {
    const events = await runSourceExtractor(
      source,
      source.extraction.module,
      source.extraction.waitFor,
    );
    console.log(JSON.stringify(events, null, 2));
  }
}

if (import.meta.main) {
  const target = process.argv[2];
  const forcePlaywright = process.argv.includes("--force-playwright");
  const wantJson = process.argv.includes("--json");

  if (!target) {
    console.error(
      "Usage: bun run extract-events.ts <url-or-slug> [--force-playwright] [--json]",
    );
    process.exit(1);
  }

  const source = findSource(target);
  if (!source) {
    console.error(`Unknown source: ${target}`);
    console.error("Pass a registered slug or URL from sources.ts.");
    process.exit(1);
  }

  try {
    await dispatch(source, forcePlaywright, wantJson);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`extract-events failed for ${source.slug}: ${msg}`);
    process.exit(1);
  }
}
