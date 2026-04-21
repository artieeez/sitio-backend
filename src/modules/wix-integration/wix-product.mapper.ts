import type { WixCatalogProduct } from "./wix-catalog.types";
import { productDescriptionToRichTextHtml } from "./wix-product-description-html";

export type WixProductSummaryDto = {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  imageUrl: string | null;
  /** Wix Media Manager file id for the main product image, when present. */
  wixMediaFileId: string | null;
  productPageUrl: string | null;
  /** BRL minor units when `priceData.currency` is BRL (or unknown). */
  defaultExpectedAmountMinor: number | null;
};

function productId(p: WixCatalogProduct): string {
  return (p.id ?? p._id ?? "").trim();
}

/** Best-effort main image URL from Wix Stores `media` on a product. */
export function extractWixProductImageUrl(media: unknown): string | null {
  if (!media || typeof media !== "object") return null;
  const m = media as Record<string, unknown>;
  const main = m.mainMedia;
  if (!main || typeof main !== "object") return null;
  const mm = main as Record<string, unknown>;
  const image = mm.image;
  if (image && typeof image === "object") {
    const url = (image as Record<string, unknown>).url;
    if (typeof url === "string" && url.length > 0) return url;
  }
  const thumb = mm.thumbnail;
  if (thumb && typeof thumb === "object") {
    const url = (thumb as Record<string, unknown>).url;
    if (typeof url === "string" && url.length > 0) return url;
  }
  return null;
}

/** Best-effort Wix media file id from `mainMedia.image` / `thumbnail` (for trip `wixMediaFileId`). */
export function extractWixProductMainMediaFileId(media: unknown): string | null {
  if (!media || typeof media !== "object") return null;
  const m = media as Record<string, unknown>;
  const main = m.mainMedia;
  if (!main || typeof main !== "object") return null;
  const mm = main as Record<string, unknown>;
  const fromNode = (node: unknown): string | null => {
    if (!node || typeof node !== "object") return null;
    const img = node as Record<string, unknown>;
    const id = img.id ?? img._id;
    if (typeof id === "string" && id.trim().length > 0) {
      return id.trim();
    }
    return null;
  };
  return fromNode(mm.image) ?? fromNode(mm.thumbnail);
}

function minorFromPriceData(
  p: WixCatalogProduct,
): number | null {
  const pd = p.priceData;
  if (!pd || typeof pd.price !== "number" || Number.isNaN(pd.price)) {
    return null;
  }
  const currency = (pd.currency ?? "BRL").toUpperCase();
  if (currency !== "BRL") {
    return null;
  }
  return Math.round(pd.price * 100);
}

/** Prefer explicit URL fields returned by Wix Stores reader (shape varies by catalog version). */
function productPageUrlFromProduct(p: WixCatalogProduct): string | null {
  const raw = p as Record<string, unknown>;
  const tryString = (v: unknown): string | null => {
    if (typeof v === "string" && v.trim().length > 0) {
      return v.trim();
    }
    return null;
  };

  /** Wix catalog v1 returns `productPageUrl` as `PageUrl`: `{ base, path }`, not a single string. */
  const pageUrlField = raw.productPageUrl;
  if (pageUrlField && typeof pageUrlField === "object" && !Array.isArray(pageUrlField)) {
    const u = pageUrlField as Record<string, unknown>;
    const baseRaw = u.base;
    const pathRaw = u.path;
    const base = typeof baseRaw === "string" ? baseRaw.trim().replace(/\/+$/, "") : "";
    const path = typeof pathRaw === "string" ? pathRaw.trim() : "";
    if (base && path) {
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      return `${base}${normalizedPath}`;
    }
    if (base) {
      return base;
    }
    if (path && /^https?:\/\//i.test(path)) {
      return path;
    }
  }

  const flatCandidates: unknown[] = [
    raw.productPageUrl,
    raw.productPageURL,
    raw.productUrl,
    raw.onlineStoreUrl,
    raw.url,
    raw.pageUrl,
    raw.absoluteUrl,
    raw.shortenedUrl,
    raw.externalUrl,
  ];
  for (const c of flatCandidates) {
    const s = tryString(c);
    if (s) {
      return s;
    }
  }

  const nav = raw.navigation;
  if (nav && typeof nav === "object") {
    const n = nav as Record<string, unknown>;
    const fromNav =
      tryString(n.itemUrl) ??
      tryString(n.url) ??
      tryString(n.targetUrl) ??
      tryString(n.desktopUri);
    if (fromNav) {
      return fromNav;
    }
  }

  const customUrls = raw.customUrls;
  if (customUrls && typeof customUrls === "object" && !Array.isArray(customUrls)) {
    const cu = customUrls as Record<string, unknown>;
    const fromCu =
      tryString(cu.main) ??
      tryString(cu.base) ??
      tryString(cu.productPage);
    if (fromCu) {
      return fromCu;
    }
  }

  const seo = raw.seoData;
  if (seo && typeof seo === "object") {
    const s = tryString((seo as Record<string, unknown>).canonicalUrl);
    if (s) {
      return s;
    }
  }

  return null;
}

export function toWixProductSummaryDto(
  p: WixCatalogProduct,
): WixProductSummaryDto | null {
  const id = productId(p);
  if (!id) return null;
  const name = p.name?.trim();
  if (!name) return null;
  const rawDesc = (p as Record<string, unknown>).description;
  return {
    id,
    name,
    slug: p.slug,
    description: productDescriptionToRichTextHtml(rawDesc),
    imageUrl: extractWixProductImageUrl(p.media),
    wixMediaFileId: extractWixProductMainMediaFileId(p.media),
    productPageUrl: productPageUrlFromProduct(p),
    defaultExpectedAmountMinor: minorFromPriceData(p),
  };
}
