#!/usr/bin/env bun
/**
 * Extract clean content from a web page using Mozilla's Readability.
 * Usage: bun run extract-content.ts <url> [--json]
 */

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export interface ExtractedArticle {
  title: string | null;
  byline: string | null;
  excerpt: string | null;
  siteName: string | null;
  textContent: string;
  length: number;
}

export async function extractReadable(url: string): Promise<ExtractedArticle | null> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,de;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const article = new Readability(dom.window.document).parse();

  if (!article) return null;

  return {
    title: article.title ?? null,
    byline: article.byline ?? null,
    excerpt: article.excerpt ?? null,
    siteName: article.siteName ?? null,
    textContent: article.textContent.trim(),
    length: article.length ?? article.textContent.length,
  };
}

if (import.meta.main) {
  const url = process.argv[2];
  const jsonOutput = process.argv.includes("--json");

  if (!url) {
    console.error("Usage: bun run extract-content.ts <url> [--json]");
    process.exit(1);
  }

  try {
    const article = await extractReadable(url);
    if (!article) {
      console.error("Readability could not extract content from this page.");
      process.exit(1);
    }

    if (jsonOutput) {
      console.log(JSON.stringify(article, null, 2));
    } else {
      if (article.title) console.log(`# ${article.title}\n`);
      if (article.byline) console.log(`*${article.byline}*\n`);
      console.log(article.textContent);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${msg}`);
    process.exit(1);
  }
}
