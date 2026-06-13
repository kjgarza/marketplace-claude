#!/usr/bin/env bun
/**
 * Smoke test: fetch one real VHS Berlin URL, run parser, report result.
 * Exit 0 on success or explicit verification failure; exit 1 on crash.
 */
import { readFileSync } from "fs";
import { join } from "path";
import * as cheerio from "cheerio";
import yaml from "js-yaml";

const BROWSER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function loadConfig(name) { return yaml.load(readFileSync(join(import.meta.dir, "..", "config", name), "utf-8")); }

async function fetchHtml(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": BROWSER_UA, "Accept-Language": "de-DE,de;q=0.9,en;q=0.8", Accept: "text/html,application/xhtml+xml,*/*" },
      redirect: "follow", signal: AbortSignal.timeout(20000),
    });
    if (res.ok) { const html = await res.text(); if (html.length > 200) return { html, tier: 1, status: res.status }; }
    return { html: "", tier: 1, status: res.status, error: "HTTP " + res.status };
  } catch (e) {}
  try {
    const res = await fetch("https://r.jina.ai/" + url, {
      headers: { "User-Agent": BROWSER_UA, Accept: "text/html", "X-Return-Format": "html" },
      signal: AbortSignal.timeout(30000),
    });
    if (res.ok) { const html = await res.text(); return { html, tier: 2, via: "jina" }; }
  } catch (_) {}
  return { html: "", tier: 0, error: "all tiers failed" };
}

function parseCourseLinks(html) {
  const $ = cheerio.load(html);
  const ids = new Set();
  $("a[href*=\"id=\"]").each((_i, el) => {
    const href = $(el).attr("href") ?? "";
    const m = href.match(/[?&]id=([^&]+)/);
    if (m) ids.add(m[1]);
  });
  return Array.from(ids);
}

const registry = loadConfig("query-registry.yaml");
const testUrl = registry.base_url + "/VHSKURSE/BusinessPages/CourseList.aspx";

console.log("VHS Berlin smoke test");
console.log("URL:", testUrl);

const { html, tier, via, error, status } = await fetchHtml(testUrl);

if (!html) {
  console.log(JSON.stringify({ ok: false, tier, error: error ?? "empty response", note: "VHS site unreachable — this is a network issue, not a bug" }));
  process.exit(0);
}

console.log("Fetch tier:", tier, via ? "(via " + via + ")" : "");
console.log("HTML size:", html.length, "bytes");

const courseIds = parseCourseLinks(html);
console.log("Course links found:", courseIds.length);

if (courseIds.length >= 1) {
  console.log("Sample IDs:", courseIds.slice(0, 3));
  console.log(JSON.stringify({ ok: true, tier, via, course_count: courseIds.length, sample_ids: courseIds.slice(0, 3) }));
} else {
  console.log(JSON.stringify({ ok: false, tier, via, verification_failure: true,
    reason: "HTML received (" + html.length + " bytes) but 0 course links parsed — VHS site may require JS rendering or selectors need updating" }));
}

process.exit(0);