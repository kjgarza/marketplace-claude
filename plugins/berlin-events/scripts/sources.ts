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
  {
    slug: "indexberlin",
    name: "INDEX Berlin",
    url: "https://www.indexberlin.com/events/list/",
    category: "art",
    extraction: { kind: "readability" },
  },
  {
    slug: "kw-berlin",
    name: "KW Institute",
    url: "https://www.kw-berlin.de/en/events",
    category: "art",
    extraction: { kind: "readability" },
  },
  {
    slug: "berlinischegalerie",
    name: "Berlinische Galerie",
    url: "https://berlinischegalerie.de/programme/kalender/",
    category: "art",
    extraction: { kind: "readability" },
  },
  {
    slug: "artatberlin",
    name: "ART@Berlin",
    url: "https://www.artatberlin.com/en/calendar-for-vernissagen-exhibitions-events/",
    category: "art",
    extraction: { kind: "readability" },
  },
  {
    slug: "co-berlin",
    name: "C/O Berlin",
    url: "https://co-berlin.org/de/programm/kalender",
    category: "art",
    extraction: { kind: "readability" },
  },
  {
    slug: "kunstleben",
    name: "Kunstleben Berlin",
    url: "https://kunstleben-berlin.de/events/",
    category: "art",
    extraction: { kind: "readability" },
  },
  {
    slug: "berlin-de",
    name: "Berlin.de",
    url: "https://www.berlin.de/en/events/",
    category: "food",
    extraction: { kind: "readability" },
  },
  {
    slug: "visitberlin",
    name: "visitBerlin",
    url: "https://www.visitberlin.de/en/event-calendar-berlin",
    category: "art,food",
    extraction: { kind: "readability" },
  },
  {
    slug: "tip-berlin",
    name: "Tip Berlin",
    url: "https://www.tip-berlin.de/event/",
    category: "art,food",
    extraction: {
      kind: "source-extractor",
      module: "./extractors/tip-berlin.ts",
      waitFor: "article, .event-card, [class*='event']",
    },
  },
  {
    slug: "gropius-bau",
    name: "Gropius Bau",
    url: "https://www.berlinerfestspiele.de/en/gropius-bau/programm/veranstaltungen",
    category: "art",
    extraction: {
      kind: "source-extractor",
      module: "./extractors/gropius-bau.ts",
      waitFor: "article, .event, .program, [class*='teaser']",
    },
  },
  {
    slug: "mitvergnuegen",
    name: "Mit Vergnügen",
    url: "https://mitvergnuegen.com/category/ausgehen/events",
    category: "food",
    extraction: {
      kind: "source-extractor",
      module: "./extractors/mitvergnuegen.ts",
      waitFor: "article, .post, [class*='card']",
    },
  },
];

export function findSource(urlOrSlug: string): SourceConfig | undefined {
  return SOURCES.find((s) => s.slug === urlOrSlug || s.url === urlOrSlug);
}
