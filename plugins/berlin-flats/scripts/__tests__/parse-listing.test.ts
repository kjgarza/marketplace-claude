import { describe, expect, test } from "bun:test";
import { parseDetail, parseSearchResults } from "../parse-listing.ts";

const kleinanzeigenSearchHtml = `
<html><body>
<article class="aditem" data-adid="123">
  <a class="ellipsis" href="/s-anzeige/wohnung-mitte/2912345678-203-456">Schöne Altbauwohnung Mitte</a>
  <p class="aditem-main--middle--price-shipping--price">1.800 €</p>
  <p class="aditem-main--top--left">10115 Berlin Mitte</p>
  <p class="aditem-main--top--right">Heute</p>
</article>
<article class="aditem" data-adid="456">
  <a class="ellipsis" href="/s-anzeige/wg-zimmer/2987654321-203-789">WG Zimmer Kreuzberg</a>
  <p class="aditem-main--middle--price-shipping--price">500 €</p>
  <p class="aditem-main--top--left">10961 Berlin Kreuzberg</p>
</article>
<article class="aditem" data-adid="999">
  <a class="ellipsis" href="/s-anzeige/fahrrad/2999999999-217-789">Fahrrad</a>
</article>
</body></html>`;

const kleinanzeigenDetailHtml = `
<html><body>
<h1 id="viewad-title">Helle 2-Zimmer-Wohnung Mitte</h1>
<h2 id="viewad-price">1.350 €</h2>
<span id="viewad-locality">10115 Berlin Mitte</span>
<p id="viewad-description-text">Schöne Altbauwohnung mit Balkon.</p>
<ul class="addetailslist">
  <li class="addetailslist--detail">
    <span class="addetailslist--detail--title">Wohnfläche</span>
    <span class="addetailslist--detail--value">65 m²</span>
  </li>
  <li class="addetailslist--detail">
    <span class="addetailslist--detail--title">Zimmer</span>
    <span class="addetailslist--detail--value">2</span>
  </li>
</ul>
<meta property="og:url" content="https://www.kleinanzeigen.de/s-anzeige/test/789-101" />
</body></html>`;

describe("parseSearchResults", () => {
  test("parses Kleinanzeigen apartment cards and skips adjacent categories", () => {
    const results = parseSearchResults(kleinanzeigenSearchHtml, "kleinanzeigen");
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      portal: "kleinanzeigen",
      external_id: "123",
      title: "Schöne Altbauwohnung Mitte",
      cold_rent: 1800,
      district: "10115 Berlin Mitte",
    });
  });

  test("returns an empty array for malformed HTML", () => {
    expect(parseSearchResults("<html>", "kleinanzeigen")).toEqual([]);
  });
});

describe("parseDetail", () => {
  test("parses Kleinanzeigen detail pages", () => {
    const detail = parseDetail(
      kleinanzeigenDetailHtml,
      "kleinanzeigen",
      "https://www.kleinanzeigen.de/s-anzeige/test/789-101",
    );
    expect(detail.title).toBe("Helle 2-Zimmer-Wohnung Mitte");
    expect(detail.cold_rent).toBe(1350);
    expect(detail.sqm).toBe(65);
    expect(detail.rooms).toBe(2);
    expect(detail.external_id).toBe("789");
  });
});
