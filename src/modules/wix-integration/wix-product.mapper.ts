import type { WixCatalogProduct } from "./wix-catalog.types";

export type WixProductSummaryDto = {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  imageUrl: string | null;
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

/** Prefer explicit URL fields returned by Wix when present. */
function productPageUrlFromProduct(p: WixCatalogProduct): string | null {
  const raw = p as Record<string, unknown>;
  const direct =
    raw.productPageUrl ??
    raw.productPageURL ??
    raw.url ??
    raw.pageUrl;
  if (typeof direct === "string" && direct.trim().length > 0) {
    return direct.trim();
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
  return {
    id,
    name,
    slug: p.slug,
    description: p.description ?? null,
    imageUrl: extractWixProductImageUrl(p.media),
    productPageUrl: productPageUrlFromProduct(p),
    defaultExpectedAmountMinor: minorFromPriceData(p),
  };
}
