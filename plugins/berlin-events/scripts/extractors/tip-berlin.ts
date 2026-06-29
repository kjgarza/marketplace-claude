import type { Page } from "playwright";
import type { Event } from "../types.ts";
import { parseGermanDate } from "./parse-date.ts";

const SOURCE_NAME = "Tip Berlin";

export async function extract(page: Page): Promise<Event[]> {
  const raw = await page.evaluate(() => {
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>(
        "article, .event-card, [class*='event-teaser'], [class*='c-teaser']",
      ),
    );
    return cards
      .map((card) => {
        const link =
          card.querySelector<HTMLAnchorElement>("a[href]")?.href ?? null;
        const heading =
          card.querySelector("h1, h2, h3, h4")?.textContent?.trim() ?? null;
        const dateEl = card.querySelector(
          "time, [class*='date'], [class*='Date']",
        );
        const dateText =
          dateEl?.getAttribute("datetime") ??
          dateEl?.textContent?.trim() ??
          null;
        const venueEl = card.querySelector(
          "[class*='venue'], [class*='location'], [class*='Location']",
        );
        const venue = venueEl?.textContent?.trim() ?? null;
        const text = (card.innerText ?? "").trim().replace(/\s+/g, " ");
        return { link, heading, dateText, venue, text };
      })
      .filter((c) => c.heading && c.link);
  });

  const events: Event[] = [];
  for (const card of raw) {
    const parsed = parseGermanDate(card.dateText ?? card.text);
    if (!parsed) continue;
    events.push({
      name: card.heading!,
      date: parsed.date,
      ...(parsed.time ? { time: parsed.time } : {}),
      venue: card.venue ?? "Tip Berlin (venue TBC)",
      category: "art",
      description: card.text.slice(0, 240),
      url: card.link!,
      source: SOURCE_NAME,
    });
  }
  return events;
}
