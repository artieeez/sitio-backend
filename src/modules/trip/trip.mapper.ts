import type { Trip } from "@prisma/client";

export function mapTrip(t: Trip) {
  return {
    id: t.id,
    schoolId: t.schoolId,
    active: t.active,
    defaultExpectedAmountMinor: t.defaultExpectedAmountMinor,
    url: t.url,
    title: t.title,
    description: t.description,
    imageUrl: t.imageUrl,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}
