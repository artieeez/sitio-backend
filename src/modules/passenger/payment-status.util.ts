import type { Passenger, Payment, Trip } from "@prisma/client";

export type DerivedPaymentStatus =
  | "pending"
  | "settled_payments"
  | "settled_manual"
  | "unavailable";

export function effectiveExpectedMinor(
  passenger: Pick<Passenger, "expectedAmountOverrideMinor">,
  trip: Pick<Trip, "defaultExpectedAmountMinor">,
): number | null {
  if (passenger.expectedAmountOverrideMinor != null) {
    return passenger.expectedAmountOverrideMinor;
  }
  if (trip.defaultExpectedAmountMinor != null) {
    return trip.defaultExpectedAmountMinor;
  }
  return null;
}

export function sumPaymentsMinor(
  payments: Pick<Payment, "amountMinor">[],
): number {
  return payments.reduce((acc, p) => acc + p.amountMinor, 0);
}

export function derivePaymentStatus(input: {
  manualPaidWithoutInfo: boolean;
  effectiveExpectedMinor: number | null;
  paidTotalMinor: number;
}): DerivedPaymentStatus {
  if (input.manualPaidWithoutInfo) {
    return "settled_manual";
  }
  const expected = input.effectiveExpectedMinor;
  if (expected != null) {
    if (input.paidTotalMinor >= expected) {
      return "settled_payments";
    }
    if (input.paidTotalMinor > 0) {
      return "pending";
    }
    return "pending";
  }
  return "unavailable";
}
