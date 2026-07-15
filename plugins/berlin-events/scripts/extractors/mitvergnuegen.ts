import type { Page } from "playwright";
import type { Event } from "../types.ts";
import { parseGermanDate } from "./parse-date.ts";

const SOURCE_NAME = "Mit Vergnügen";

export async function extract(page: Page): Promise<Event[]> {
  const raw = await page.evaluate(() => {
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>(
        "article, .post, [class*='card'], [class*='Post'], [class*='Article']",
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
        const text = (card.innerText ?? "").trim().replace(/\s+/g, " ");
        return { link, heading, dateText, text };
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
      venue: "Mit Vergnügen (venue in article)",
      category: "food",
      description: card.text.slice(0, 240),
      url: card.link!,
      source: SOURCE_NAME,
    });
  }
  return events;
}
