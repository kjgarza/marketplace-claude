#!/usr/bin/env bun
/**
 * Extract clean content from a web page using Mozilla's Readability.
 * Usage: bun run extract-content.js <url> [--json]
 *
 * Returns the main text content stripped of navigation, ads, and boilerplate.
 * With --json flag, returns structured JSON with title, byline, excerpt, and content.
 */

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const url = process.argv[2];
const jsonOutput = process.argv.includes("--json");

if (!url) {
  console.error("Usage: bun run extract-content.js <url> [--json]");
  process.exit(1);
}

try {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,de;q=0.8",
    },
  });

  if (!response.ok) {
    console.error(`HTTP ${response.status}: ${response.statusText}`);
    process.exit(1);
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article) {
    console.error("Readability could not extract content from this page.");
    process.exit(1);
  }

  if (jsonOutput) {
    console.log(
      JSON.stringify(
        {
          title: article.title,
          byline: article.byline,
          excerpt: article.excerpt,
          siteName: article.siteName,
          textContent: article.textContent.trim(),
          length: article.length,
        },
        null,
        2
      )
    );
  } else {
    if (article.title) console.log(`# ${article.title}\n`);
    if (article.byline) console.log(`*${article.byline}*\n`);
    console.log(article.textContent.trim());
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
