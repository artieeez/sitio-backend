import type { Payment } from "@prisma/client";

export function formatDateOnly(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateOnlyToUtc(s: string): Date {
  const [y, mo, d] = s.split("-").map((x) => Number.parseInt(x, 10));
  return new Date(Date.UTC(y, mo - 1, d));
}

export function mapPayment(p: Payment) {
  return {
    id: p.id,
    passengerId: p.passengerId,
    amountMinor: p.amountMinor,
    paidOn: formatDateOnly(p.paidOn),
    location: p.location,
    payerIdentity: p.payerIdentity,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}
