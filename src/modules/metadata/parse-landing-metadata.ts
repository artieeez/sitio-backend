import type { LandingMetadataResponse } from './dto/fetch-page.dto';

/** ISO 4217 minor units per major unit (typical retail). Defaults to 2 decimals. */
const MINOR_PER_MAJOR_UNIT: Record<string, number> = {
  BRL: 100,
  USD: 100,
  EUR: 100,
  GBP: 100,
  JPY: 1,
};

export function parseLandingMetadataFromHtml(
  html: string,
  pageUrl: URL,
): LandingMetadataResponse {
  const pickMeta = (attr: 'property' | 'name', key: string): string | null => {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(
      `<meta[^>]+${attr}=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`,
      'i',
    );
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${escaped}["'][^>]*>`,
      'i',
    );
    return html.match(re)?.[1] ?? html.match(re2)?.[1] ?? null;
  };

  const titleFromJsonLd = extractJsonLdProductName(html);
  const titleFromEmbeddedJson = extractProductNameNearProductType(html);
  const titleFromProductMeta = pickMeta('property', 'product:title');
  const titleFromOg = pickMeta('property', 'og:title');
  const titleTag =
    html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? null;
  const title =
    titleFromJsonLd ??
    titleFromEmbeddedJson ??
    titleFromProductMeta ??
    titleFromOg ??
    titleTag;

  const description =
    pickMeta('property', 'og:description') ??
    pickMeta('name', 'description') ??
    null;

  const ogImage = pickMeta('property', 'og:image');
  const imageUrl = ogImage ? absolutizeUrl(ogImage, pageUrl) : null;

  let faviconUrl: string | null = null;
  const iconHref =
    html.match(
      /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i,
    )?.[1] ??
    html.match(
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i,
    )?.[1] ??
    null;
  if (iconHref) {
    faviconUrl = absolutizeUrl(iconHref, pageUrl);
  } else {
    faviconUrl = new URL('/favicon.ico', pageUrl).href;
  }

  const priceAmountRaw = pickMeta('property', 'product:price:amount');
  const priceCurrencyRaw = pickMeta('property', 'product:price:currency');
  const defaultExpectedAmountMinor =
    priceAmountRaw != null && priceAmountRaw.trim() !== ''
      ? parsePriceAmountToMinor(priceAmountRaw, priceCurrencyRaw)
      : null;

  return {
    title,
    description,
    imageUrl,
    faviconUrl,
    defaultExpectedAmountMinor,
  };
}

function parsePriceAmountToMinor(
  amountStr: string,
  currency: string | null,
): number | null {
  const normalized = amountStr.replace(/\s/g, '').replace(',', '.');
  const n = Number.parseFloat(normalized);
  if (Number.isNaN(n) || n < 0) {
    return null;
  }
  const code = (currency ?? 'BRL').trim().toUpperCase();
  const factor = MINOR_PER_MAJOR_UNIT[code] ?? 100;
  return Math.round(n * factor);
}

function parseJsonStringFragment(fragment: string): string {
  try {
    const jsonStringLiteral = `"${fragment.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    return JSON.parse(jsonStringLiteral) as string;
  } catch {
    return fragment;
  }
}

/**
 * Some storefronts (e.g. Wix) embed Product JSON outside of `application/ld+json`.
 */
function extractProductNameNearProductType(html: string): string | null {
  const forward = html.match(
    /"@type"\s*:\s*"Product"[\s\S]{0,8000}?"name"\s*:\s*"((?:[^"\\]|\\.)*)"/i,
  );
  if (forward?.[1]) {
    return parseJsonStringFragment(forward[1]);
  }
  const backward = html.match(
    /"name"\s*:\s*"((?:[^"\\]|\\.)*)"[\s\S]{0,8000}?"@type"\s*:\s*"Product"/i,
  );
  if (backward?.[1]) {
    return parseJsonStringFragment(backward[1]);
  }
  return null;
}

function extractJsonLdProductName(html: string): string | null {
  const scriptRe =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = scriptRe.exec(html)) !== null) {
    const raw = m[1]?.trim();
    if (!raw) {
      continue;
    }
    try {
      const data = JSON.parse(raw) as unknown;
      const name = findProductNameInJsonLd(data);
      if (name) {
        return name;
      }
    } catch {
      /* skip invalid JSON */
    }
  }
  return null;
}

function findProductNameInJsonLd(node: unknown): string | null {
  if (node === null || node === undefined) {
    return null;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      const n = findProductNameInJsonLd(item);
      if (n) {
        return n;
      }
    }
    return null;
  }
  if (typeof node === 'object') {
    const o = node as Record<string, unknown>;
    const types = o['@type'];
    const isProductType = (t: string) =>
      t === 'Product' || t.endsWith('/Product') || t.endsWith(':Product');
    const isProduct =
      (typeof types === 'string' && isProductType(types)) ||
      (Array.isArray(types) &&
        types.some((t) => typeof t === 'string' && isProductType(t)));
    if (isProduct && typeof o.name === 'string' && o.name.trim()) {
      return o.name.trim();
    }
    if (o['@graph']) {
      const n = findProductNameInJsonLd(o['@graph']);
      if (n) {
        return n;
      }
    }
    if (o.mainEntity) {
      const n = findProductNameInJsonLd(o.mainEntity);
      if (n) {
        return n;
      }
    }
    for (const v of Object.values(o)) {
      const n = findProductNameInJsonLd(v);
      if (n) {
        return n;
      }
    }
  }
  return null;
}

function absolutizeUrl(href: string, base: URL): string {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}
