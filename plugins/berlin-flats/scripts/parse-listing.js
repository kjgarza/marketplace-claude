import * as cheerio from 'cheerio';

function parseEurDe(str) {
  if (!str) return null;
  const clean = str.replace(/[€\s]/g, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? null : num;
}

function parseFloatDe(str) {
  if (!str) return null;
  const clean = str.trim().replace(',', '.').replace(/[^\d.]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? null : num;
}

export function parseSearchResults(html, portal) {
  const $ = cheerio.load(html);
  const listings = [];

  if (portal === 'kleinanzeigen') {
    $('article.aditem').each((_, el) => {
      const $el = $(el);
      const anchor = $el.find('a.ellipsis').first();
      const href = anchor.attr('href') || '';
      const url = href.startsWith('http') ? href : `https://www.kleinanzeigen.de${href}`;

      // Filter to apartment rental category (-203-) only; skip jobs, products, etc.
      // Note: when using categoryId=203 in URL, all results should be -203-, but guard anyway
      if (href && href.includes('/s-anzeige/') && !/-203-/.test(href)) return;

      const idMatch = href.match(/\/(\d+)-\d+\/?$/) || url.match(/\/(\d+)-\d+\/?$/);
      const external_id = idMatch ? idMatch[1] : ($el.attr('data-adid') || url);
      const priceText = $el.find('.aditem-main--middle--price-shipping--price').first().text().trim();
      listings.push({
        portal,
        external_id,
        url,
        title: anchor.text().trim(),
        cold_rent: parseEurDe(priceText),
        district: $el.find('.aditem-main--top--left').text().trim(),
        posted_at: $el.find('.aditem-main--top--right').text().trim(),
      });
    });
  }

  if (portal === 'immoscout24') {
    // ImmoScout search results — try hydration blob first
    const nextData = $('script#__NEXT_DATA__').text();
    if (nextData) {
      try {
        const data = JSON.parse(nextData);
        const results = data?.props?.pageProps?.searchResponse?.resultlist?.resultlistEntries?.[0]?.resultlistEntry || [];
        for (const entry of results) {
          const r = entry.resultlistRealEstate || entry;
          const id = String(r.id || r['@id'] || '');
          listings.push({
            portal,
            external_id: id,
            url: `https://www.immobilienscout24.de/expose/${id}`,
            title: r.title || r.address?.city || '',
            cold_rent: r.price?.value || null,
            warm_rent: r.calculatedTotalRent?.totalRent?.value || null,
            sqm: r.livingSpace || null,
            rooms: r.numberOfRooms || null,
            district: r.address?.quarter || r.address?.city || '',
            posted_at: r.creationDate || '',
          });
        }
      } catch (_) { /* fall through to DOM */ }
    }

    // DOM fallback
    if (listings.length === 0) {
      $('[data-id]').each((_, el) => {
        const $el = $(el);
        const id = $el.attr('data-id') || '';
        if (!id) return;
        listings.push({
          portal,
          external_id: id,
          url: `https://www.immobilienscout24.de/expose/${id}`,
          title: $el.find('h5, .result-list-entry__brand-title').first().text().trim(),
          cold_rent: parseEurDe($el.find('.result-list-entry__primary-criterion--price').first().text()),
          district: $el.find('.result-list-entry__address').first().text().trim(),
          posted_at: '',
        });
      });
    }
  }

  return listings;
}

export function parseDetail(html, portal, url) {
  const $ = cheerio.load(html);
  const listing = { portal, url };

  if (portal === 'kleinanzeigen') {
    listing.title = $('h1#viewad-title').text().trim() || $('h1').first().text().trim();
    listing.cold_rent = parseEurDe($('h2#viewad-price').text());
    listing.warm_rent = null;
    listing.description = $('#viewad-description-text').text().trim();
    listing.district = $('#viewad-locality').text().trim().replace(/\d{5}\s*/g, '').trim();

    let sqmText = '';
    let roomsText = '';
    $('.addetailslist--detail').each((_, row) => {
      const label = $(row).find('.addetailslist--detail--title').text();
      const value = $(row).find('.addetailslist--detail--value').text();
      if (/wohnfl/i.test(label)) sqmText = value;
      if (/zimmer/i.test(label)) roomsText = value;
    });
    listing.sqm = parseFloatDe(sqmText);
    listing.rooms = parseFloatDe(roomsText);

    const ogUrl = $('meta[property="og:url"]').attr('content') || url;
    const idMatch = ogUrl.match(/\/(\d+)-\d+\/?$/) || url.match(/\/(\d+)-\d+\/?$/);
    listing.external_id = idMatch ? idMatch[1] : url.split('/').pop();

    listing.image_urls = [];
    $('.galleryimage-element img, #viewad-image img').each((_, img) => {
      const src = $(img).attr('src') || $(img).attr('data-src');
      if (src && !src.includes('placeholder')) listing.image_urls.push(src);
    });
  }

  if (portal === 'immoscout24') {
    // Try hydration blob
    const nextData = $('script#__NEXT_DATA__').text();
    if (nextData) {
      try {
        const data = JSON.parse(nextData);
        const expose = data?.props?.pageProps?.expose || data?.props?.pageProps?.listingData;
        if (expose) {
          listing.title = expose.title || '';
          listing.cold_rent = expose.price?.value || null;
          listing.warm_rent = expose.totalRent?.value || null;
          listing.sqm = expose.livingSpace || null;
          listing.rooms = expose.numberOfRooms || null;
          listing.district = expose.address?.quarter || expose.address?.city || '';
          listing.description = expose.descriptionNote || '';
          const idMatch = url.match(/\/expose\/(\d+)/);
          listing.external_id = idMatch ? idMatch[1] : url.split('/').pop();
          return listing;
        }
      } catch (_) { /* fall through */ }
    }

    // DOM fallback
    listing.title = $('h1').first().text().trim();
    listing.cold_rent = parseEurDe($('[data-qa="is24qa-kaltmiete"] dd').text());
    listing.warm_rent = parseEurDe($('[data-qa="is24qa-warmmiete"] dd').text());
    listing.sqm = parseFloatDe($('[data-qa="is24qa-wohnflaeche"] dd').text());
    listing.rooms = parseFloatDe($('[data-qa="is24qa-zimmer"] dd').text());
    listing.district = $('[data-qa="is24qa-ort"] span').first().text().trim();
    listing.description = $('.is24qa-objektbeschreibung').text().trim();
    const idMatch = url.match(/\/expose\/(\d+)/);
    listing.external_id = idMatch ? idMatch[1] : url.split('/').pop();
  }

  return listing;
}
