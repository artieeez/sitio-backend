export function normalizePhoneNumber(
  raw: string | null | undefined,
): string | null {
  if (raw == null || raw === "") {
    return null;
  }
  const digits = raw.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}
