#!/usr/bin/env bun
/**
 * Render a page with Playwright (chromium) and run Readability over the
 * fully-rendered DOM. Use as a fallback when extract-content.ts returns
 * empty/consent-only text for a JS-rendered source.
 *
 * Usage:
 *   bun run render-content.ts <url> [--selector=<css>] [--json]
 */

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

const COOKIE_BUTTON_LABELS = [
  "Accept all",
  "Accept",
  "Allow all",
  "Alle akzeptieren",
  "Akzeptieren",
  "Zustimmen",
  "Einverstanden",
  "OK",
];

const BERLIN_CONTEXT_OPTIONS = {
  locale: "de-DE",
  timezoneId: "Europe/Berlin",
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  serviceWorkers: "block" as const,
};

export async function openBrowser(): Promise<Browser> {
  return chromium.launch({ headless: true });
}

export async function newBerlinContext(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext(BERLIN_CONTEXT_OPTIONS);
  await context.route("**/*", async (route) => {
    const type = route.request().resourceType();
    if (type === "image" || type === "font" || type === "media") {
      await route.abort();
    } else {
      await route.continue();
    }
  });
  return context;
}

export async function dismissCookieBanner(page: Page): Promise<void> {
  for (const label of COOKIE_BUTTON_LABELS) {
    const button = page.getByRole("button", { name: label });
    const visible = await button
      .first()
      .isVisible()
      .catch(() => false);
    if (visible) {
      await button
        .first()
        .click()
        .catch(() => {});
      return;
    }
  }
}

export async function scrollToLoad(page: Page, passes = 5): Promise<void> {
  for (let i = 0; i < passes; i++) {
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(500);
  }
}

export interface RenderedPage {
  title: string;
  url: string;
  textContent: string;
  htmlLength: number;
}

export async function renderAndExtract(
  url: string,
  options: { selector?: string; scrollPasses?: number } = {},
): Promise<RenderedPage> {
  const browser = await openBrowser();
  try {
    const context = await newBerlinContext(browser);
    const page = await context.newPage();

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await dismissCookieBanner(page);

    if (options.selector) {
      await page
        .locator(options.selector)
        .first()
        .waitFor({ state: "visible", timeout: 15_000 })
        .catch(() => {});
    }

    await scrollToLoad(page, options.scrollPasses ?? 5);

    const html = await page.content();
    const dom = new JSDOM(html, { url });
    const article = new Readability(dom.window.document).parse();
    const pageTitle = await page.title();

    return {
      title: article?.title ?? pageTitle,
      url,
      textContent: article?.textContent?.trim() ?? "",
      htmlLength: html.length,
    };
  } finally {
    await browser.close();
  }
}

if (import.meta.main) {
  const url = process.argv[2];
  const selectorArg = process.argv.find((a) => a.startsWith("--selector="));
  const selector = selectorArg?.replace("--selector=", "");
  const jsonOutput = process.argv.includes("--json");

  if (!url) {
    console.error(
      "Usage: bun run render-content.ts <url> [--selector=.event-card] [--json]",
    );
    process.exit(1);
  }

  try {
    const result = await renderAndExtract(url, { selector });
    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`# ${result.title}\n`);
      console.log(result.textContent);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Playwright extraction failed: ${msg}`);
    process.exit(1);
  }
}
