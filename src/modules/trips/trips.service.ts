import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PassengerDocumentStatus,
  PassengerPaymentStatus,
  TripStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  listBySchool(schoolId: string) {
    return this.prisma.trip.findMany({
      where: { schoolId },
      orderBy: { title: 'asc' },
    });
  }

  async passengerStatus(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        passengers: {
          where: { lifecycle: 'ACTIVE' },
          orderBy: { fullName: 'asc' },
        },
      },
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    const passengers = trip.passengers.map((p) => ({
      id: p.id,
      fullName: p.fullName,
      paymentStatus: p.paymentStatus as PassengerPaymentStatus,
      documentStatus: p.documentStatus as PassengerDocumentStatus,
      flagged: p.isFlagged,
    }));
    return {
      trip: {
        id: trip.id,
        schoolId: trip.schoolId,
        title: trip.title,
        code: trip.code,
        startsAt: trip.startsAt,
        endsAt: trip.endsAt,
        status: trip.status as TripStatus,
      },
      passengers,
    };
  }

  async ensureTripInSchool(tripId: string, schoolId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, schoolId },
    });
    if (!trip) {
      throw new NotFoundException('Trip not found for school');
    }
    return trip;
  }

  async getTripOrThrow(tripId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    return trip;
  }
}
