import type { Passenger, Payment, Trip } from "@prisma/client";
import { formatCpfDisplay } from "./cpf.util";
import {
  derivePaymentStatus,
  effectiveExpectedMinor,
  sumPaymentsMinor,
} from "./payment-status.util";

export function mapPassengerBase(p: Passenger) {
  return {
    id: p.id,
    tripId: p.tripId,
    fullName: p.fullName,
    cpf: p.cpfNormalized ? formatCpfDisplay(p.cpfNormalized) : null,
    parentName: p.parentName,
    parentPhoneNumber: p.parentPhoneNumber,
    parentEmail: p.parentEmail,
    expectedAmountOverrideMinor: p.expectedAmountOverrideMinor,
    manualPaidWithoutInfo: p.manualPaidWithoutInfo,
    removedAt: p.removedAt ? p.removedAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export function mapPassengerWithStatus(
  p: Passenger,
  trip: Trip,
  payments: Pick<Payment, "amountMinor">[],
) {
  const paidTotalMinor = sumPaymentsMinor(payments);
  const effective = effectiveExpectedMinor(p, trip);
  const status = derivePaymentStatus({
    manualPaidWithoutInfo: p.manualPaidWithoutInfo,
    effectiveExpectedMinor: effective,
    paidTotalMinor,
  });
  return {
    ...mapPassengerBase(p),
    status,
    paidTotalMinor,
    effectiveExpectedMinor: effective,
  };
}
