import type { WixStoreCollection } from "./wix-catalog.types";

export type WixCollectionSummaryDto = {
  id: string;
  name: string;
  slug?: string;
  visible?: boolean;
  description?: string | null;
  numberOfProducts?: number;
  imageUrl: string | null;
};

function collectionId(c: WixStoreCollection): string {
  return (c.id ?? c._id ?? "").trim();
}

/** Best-effort main image URL from Wix Stores `media` payload. */
export function extractWixCollectionImageUrl(media: unknown): string | null {
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

export function toWixCollectionSummaryDto(
  c: WixStoreCollection,
): WixCollectionSummaryDto | null {
  const id = collectionId(c);
  if (!id) return null;
  const name = c.name?.trim();
  if (!name) return null;
  return {
    id,
    name,
    slug: c.slug,
    visible: c.visible,
    description: c.description ?? null,
    numberOfProducts: c.numberOfProducts,
    imageUrl: extractWixCollectionImageUrl(c.media),
  };
}
