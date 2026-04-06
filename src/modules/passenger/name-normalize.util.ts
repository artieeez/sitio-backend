/** Normalize passenger full name for duplicate warning (FR-032). */
export function normalizeFullNameForMatch(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}
