import type { Trip } from "@prisma/client";

export function mapTrip(t: Trip) {
  return {
    id: t.id,
    schoolId: t.schoolId,
    active: t.active,
    wixProductId: t.wixProductId,
    wixProductSlug: t.wixProductSlug,
    wixProductPageUrl: t.wixProductPageUrl,
    defaultExpectedAmountMinor: t.defaultExpectedAmountMinor,
    title: t.title,
    description: t.description,
    imageUrl: t.imageUrl,
    wixMediaFileId: t.wixMediaFileId,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}
