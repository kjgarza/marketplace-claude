const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
import type { ScrapeResult } from "./types.ts";

export function jinaHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': BROWSER_UA,
    'Accept': 'text/html,text/plain',
    'X-Return-Format': 'html',
  };
  // Keyless Jina Reader is capped at 20 RPM; a free API key raises that to 100 RPM.
  if (process.env.JINA_API_KEY) {
    headers['Authorization'] = `Bearer ${process.env.JINA_API_KEY}`;
  }
  return headers;
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  // Tier 1: plain fetch
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': BROWSER_UA,
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const html = await res.text();
      if (html.length > 500) return { html, tier: 1, url: res.url };
    }
  } catch (_) { /* fall through */ }

  // Tier 2: Jina Reader
  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const res = await fetch(jinaUrl, {
      headers: jinaHeaders(),
      signal: AbortSignal.timeout(25000),
    });
    if (res.ok) {
      const html = await res.text();
      return { html, tier: 2, url, via: 'jina' };
    }
  } catch (_) { /* fall through */ }

  return { html: '', tier: 0, url, error: 'all tiers failed' };
}
