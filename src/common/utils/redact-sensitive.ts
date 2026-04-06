const SENSITIVE_KEYS = new Set([
  "cpf",
  "cpfNormalized",
  "cpf_normalized",
  "parentPhoneNumber",
  "parent_phone_number",
]);

/** Deep-clone plain JSON-like values and replace sensitive keys with `[REDACTED]`. */
export function redactSensitive<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item)) as T;
  }
  if (typeof value === "object" && value.constructor === Object) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEYS.has(k) ? "[REDACTED]" : redactSensitive(v);
    }
    return out as T;
  }
  return value;
}
