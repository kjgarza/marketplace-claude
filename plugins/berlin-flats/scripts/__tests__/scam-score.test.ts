import { describe, expect, test } from "bun:test";
import { scamScore } from "../scam-score.ts";

describe("scamScore", () => {
  test("blocks hard-rule payment scams", () => {
    const result = scamScore({
      portal: "kleinanzeigen",
      url: "https://example.test/1",
      description: "Schicken Sie die Kaution per Western Union vor der Besichtigung.",
      cold_rent: 600,
      sqm: 80,
      district: "Mitte",
    });
    expect(result.score).toBeGreaterThanOrEqual(0.85);
    expect(result.verdict).toBe("block");
  });

  test("preserves combined fraud indicator scoring", () => {
    const result = scamScore({
      portal: "kleinanzeigen",
      url: "https://example.test/2",
      title: "Wohnung Mitte",
      description: "Ich bin im Urlaub und sende die Schlüssel per Post.",
      cold_rent: 400,
      sqm: 70,
      district: "Berlin Mitte",
    });
    expect(result.score).toBeGreaterThanOrEqual(0.55);
    expect(result.verdict).toBe("block");
  });

  test("keeps benign listings below the review threshold", () => {
    const result = scamScore({
      portal: "kleinanzeigen",
      url: "https://example.test/3",
      title: "Schöne Altbauwohnung",
      description: "Schöne Altbauwohnung mit Balkon, ruhige Lage.",
      cold_rent: 1400,
      sqm: 75,
      district: "Mitte",
    });
    expect(result.score).toBeLessThan(0.55);
    expect(result.verdict).toBe("ok");
  });
});
