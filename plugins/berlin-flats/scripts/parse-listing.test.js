import { parseSearchResults, parseDetail } from './parse-listing.js';

const mockSearchHtml = `
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
</body></html>`;

const results = parseSearchResults(mockSearchHtml, 'kleinanzeigen');
console.assert(results.length === 2, `finds two listings: ${results.length}`);
console.assert(results[0].title === 'Schöne Altbauwohnung Mitte', `title: ${results[0].title}`);
console.assert(results[0].cold_rent === 1800, `rent parsed: ${results[0].cold_rent}`);
console.assert(results[0].external_id === '123', `id: ${results[0].external_id}`);

const mockDetailHtml = `
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

const detail = parseDetail(mockDetailHtml, 'kleinanzeigen', 'https://www.kleinanzeigen.de/s-anzeige/test/789-101');
console.assert(detail.title === 'Helle 2-Zimmer-Wohnung Mitte', `detail title: ${detail.title}`);
console.assert(detail.cold_rent === 1350, `detail rent: ${detail.cold_rent}`);
console.assert(detail.sqm === 65, `detail sqm: ${detail.sqm}`);
console.assert(detail.rooms === 2, `detail rooms: ${detail.rooms}`);
console.log('parse tests passed');
