import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditActorType,
  PassengerCreatedVia,
  PaymentAuditEventType,
  PaymentEntrySource,
  PaymentRecordStatus,
  PassengerPaymentStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReconciliationService {
  constructor(private readonly prisma: PrismaService) {}

  list(status?: PaymentRecordStatus) {
    return this.prisma.paymentRecord.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        suspectedDuplicates: { select: { id: true } },
      },
    });
  }

  async match(
    paymentId: string,
    passengerId: string,
    userId: string,
    reason: string,
  ) {
    const payment = await this.prisma.paymentRecord.findUnique({
      where: { id: paymentId },
    });
    const passenger = await this.prisma.passenger.findUnique({
      where: { id: passengerId },
    });
    if (!payment || !passenger) {
      throw new NotFoundException('Payment or passenger not found');
    }
    if (payment.status !== PaymentRecordStatus.UNMATCHED) {
      throw new ConflictException('Payment is not unmatched');
    }
    if (payment.tripId && payment.tripId !== passenger.tripId) {
      throw new ConflictException('Trip mismatch');
    }
    const dup = await this.prisma.paymentRecord.findFirst({
      where: {
        integrationSource: payment.integrationSource,
        externalPaymentId: payment.externalPaymentId,
        id: { not: payment.id },
        status: { in: [PaymentRecordStatus.MATCHED, PaymentRecordStatus.VERIFIED] },
      },
    });
    if (dup) {
      throw new ConflictException('Duplicate integration payment already applied');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.paymentRecord.update({
        where: { id: paymentId },
        data: {
          status: PaymentRecordStatus.MATCHED,
          matchedPassengerId: passengerId,
          tripId: passenger.tripId,
        },
      });
      await tx.paymentAuditEvent.create({
        data: {
          paymentRecordId: paymentId,
          eventType: PaymentAuditEventType.MATCHED,
          actorType: AuditActorType.INTERNAL_USER,
          actorId: userId,
          toPassengerId: passengerId,
          reason,
        },
      });
      await tx.passenger.update({
        where: { id: passengerId },
        data: { paymentStatus: PassengerPaymentStatus.PAID },
      });
    });
    return { ok: true };
  }

  async verify(paymentId: string, userId: string) {
    const payment = await this.prisma.paymentRecord.findUnique({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (payment.status !== PaymentRecordStatus.MATCHED) {
      throw new ConflictException('Payment must be matched before verify');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.paymentRecord.update({
        where: { id: paymentId },
        data: {
          status: PaymentRecordStatus.VERIFIED,
          verifiedByUserId: userId,
          verifiedAt: new Date(),
        },
      });
      await tx.paymentAuditEvent.create({
        data: {
          paymentRecordId: paymentId,
          eventType: PaymentAuditEventType.VERIFIED,
          actorType: AuditActorType.INTERNAL_USER,
          actorId: userId,
          toPassengerId: payment.matchedPassengerId,
        },
      });
    });
    return { ok: true };
  }

  async reassign(
    paymentId: string,
    toPassengerId: string,
    userId: string,
    reason: string,
  ) {
    if (!reason?.trim()) {
      throw new ConflictException('Reason required');
    }
    const payment = await this.prisma.paymentRecord.findUnique({
      where: { id: paymentId },
    });
    const nextPassenger = await this.prisma.passenger.findUnique({
      where: { id: toPassengerId },
    });
    if (!payment || !nextPassenger) {
      throw new NotFoundException('Payment or passenger not found');
    }
    if (!payment.matchedPassengerId) {
      throw new ConflictException('Payment is not matched');
    }
    if (payment.matchedPassengerId === toPassengerId) {
      throw new ConflictException('Same passenger');
    }
    if (payment.tripId && payment.tripId !== nextPassenger.tripId) {
      throw new ConflictException('Trip mismatch');
    }
    const fromId = payment.matchedPassengerId;
    await this.prisma.$transaction(async (tx) => {
      await tx.passenger.update({
        where: { id: fromId },
        data: { paymentStatus: PassengerPaymentStatus.PENDING },
      });
      await tx.paymentRecord.update({
        where: { id: paymentId },
        data: {
          matchedPassengerId: toPassengerId,
          tripId: nextPassenger.tripId,
        },
      });
      await tx.passenger.update({
        where: { id: toPassengerId },
        data: { paymentStatus: PassengerPaymentStatus.PAID },
      });
      await tx.paymentAuditEvent.create({
        data: {
          paymentRecordId: paymentId,
          eventType: PaymentAuditEventType.REASSIGNED,
          actorType: AuditActorType.INTERNAL_USER,
          actorId: userId,
          fromPassengerId: fromId,
          toPassengerId,
          reason,
        },
      });
    });
    return { ok: true };
  }

  async createManualPayment(
    tripId: string,
    userId: string,
    body: {
      externalPaymentId: string;
      amount?: string;
      currency?: string;
    },
  ) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    return this.prisma.paymentRecord.create({
      data: {
        entrySource: PaymentEntrySource.MANUAL_STAFF,
        integrationSource: 'manual',
        externalPaymentId: body.externalPaymentId,
        tripId,
        status: PaymentRecordStatus.UNMATCHED,
        amount: body.amount ?? undefined,
        currency: body.currency,
      },
    });
  }

  async createPassengerFromPayment(
    paymentId: string,
    userId: string,
    body: { tripId: string; fullName: string; studentDocument?: string },
  ) {
    const payment = await this.prisma.paymentRecord.findUnique({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (payment.status !== PaymentRecordStatus.UNMATCHED) {
      throw new ConflictException('Payment must be unmatched');
    }
    if (payment.tripId && payment.tripId !== body.tripId) {
      throw new ConflictException('Trip mismatch');
    }
    return this.prisma.$transaction(async (tx) => {
      const passenger = await tx.passenger.create({
        data: {
          tripId: body.tripId,
          fullName: body.fullName,
          studentDocument: body.studentDocument ?? null,
          paymentStatus: PassengerPaymentStatus.PAID,
          createdVia: PassengerCreatedVia.FROM_PAYMENT,
        },
      });
      await tx.paymentRecord.update({
        where: { id: paymentId },
        data: {
          status: PaymentRecordStatus.MATCHED,
          matchedPassengerId: passenger.id,
          tripId: body.tripId,
        },
      });
      await tx.paymentAuditEvent.create({
        data: {
          paymentRecordId: paymentId,
          eventType: PaymentAuditEventType.PASSENGER_CREATED_FROM_PAYMENT,
          actorType: AuditActorType.INTERNAL_USER,
          actorId: userId,
          toPassengerId: passenger.id,
          metadata: { fullName: body.fullName },
        },
      });
      return passenger;
    });
  }
}
