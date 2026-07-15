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

function encodeWireSnapshot(payload: unknown): string {
  return JSON.stringify(payload)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const inberlinwohnenItem = {
  id: 18588,
  title: "Wir erneuern den Boden für Sie!",
  deeplink: "https://www.gewobag.de/fuer-mietinteressentinnen/mietangebote/7100-74804-0301-0034",
  rooms: "3,5",
  area: "83,10",
  rentNet: "670,03",
  rentGross: 870.03,
  createdAt: "2026-07-01T16:31:04.000000Z",
  address: [
    { street: "Leubnitzer Weg", number: "11", zipCode: "13593", district: "Spandau" },
    { s: "arr" },
  ],
};

const inberlinwohnenSearchHtml = `
<html><body>
<div wire:id="a1" wire:snapshot="${encodeWireSnapshot({ data: { item: [inberlinwohnenItem, { s: "arr" }] } })}"></div>
<div wire:id="a2" wire:snapshot="${encodeWireSnapshot({ data: { unrelated: true } })}"></div>
<div wire:id="a3" wire:snapshot="${encodeWireSnapshot({ data: { item: [{ s: "arr" }] } })}"></div>
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

describe("parseSearchResults — inberlinwohnen", () => {
  test("extracts complete listings from Livewire wire:snapshot blobs, skipping non-item and marker-only snapshots", () => {
    const results = parseSearchResults(inberlinwohnenSearchHtml, "inberlinwohnen");
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      portal: "inberlinwohnen",
      external_id: "18588",
      url: "https://www.gewobag.de/fuer-mietinteressentinnen/mietangebote/7100-74804-0301-0034",
      title: "Wir erneuern den Boden für Sie!",
      cold_rent: 670.03,
      warm_rent: 870.03,
      sqm: 83.1,
      rooms: 3.5,
      district: "Spandau",
      posted_at: "2026-07-01T16:31:04.000000Z",
    });
  });

  test("returns an empty array when no wire:snapshot attributes are present", () => {
    expect(parseSearchResults("<html><body>no listings here</body></html>", "inberlinwohnen")).toEqual([]);
  });

  test("handles an ampersand in a title without breaking JSON decoding", () => {
    const html = `<div wire:snapshot="${encodeWireSnapshot({ data: { item: [{ ...inberlinwohnenItem, id: 999, title: "Wohnung & Garten" }, { s: "arr" }] } } )}"></div>`;
    const results = parseSearchResults(html, "inberlinwohnen");
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Wohnung & Garten");
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
