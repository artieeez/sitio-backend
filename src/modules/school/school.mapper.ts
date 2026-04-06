import type { School } from "@prisma/client";

export function mapSchool(s: School) {
  return {
    id: s.id,
    active: s.active,
    url: s.url,
    title: s.title,
    description: s.description,
    imageUrl: s.imageUrl,
    faviconUrl: s.faviconUrl,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}
