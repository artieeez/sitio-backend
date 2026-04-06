import { NotFoundException } from "@nestjs/common";
import { type IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../prisma/prisma.service";
import { mapPassengerWithStatus } from "../passenger/passenger.mapper";
import { mapTrip } from "./trip.mapper";
import {
  GetPassengerStatusAggregatesQuery,
  GetTripQuery,
  ListTripsForSchoolQuery,
} from "./trip.queries";

@QueryHandler(ListTripsForSchoolQuery)
export class ListTripsForSchoolHandler
  implements IQueryHandler<ListTripsForSchoolQuery>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListTripsForSchoolQuery) {
    const school = await this.prisma.school.findUnique({
      where: { id: query.schoolId },
    });
    if (!school) {
      throw new NotFoundException({
        message: "School not found",
        code: "NOT_FOUND",
      });
    }
    const trips = await this.prisma.trip.findMany({
      where: {
        schoolId: query.schoolId,
        ...(query.includeInactive ? {} : { active: true }),
      },
      orderBy: { createdAt: "desc" },
    });
    return trips.map(mapTrip);
  }
}

@QueryHandler(GetTripQuery)
export class GetTripHandler implements IQueryHandler<GetTripQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetTripQuery) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: query.tripId },
    });
    if (!trip) {
      throw new NotFoundException({
        message: "Trip not found",
        code: "NOT_FOUND",
      });
    }
    return mapTrip(trip);
  }
}

@QueryHandler(GetPassengerStatusAggregatesQuery)
export class GetPassengerStatusAggregatesHandler
  implements IQueryHandler<GetPassengerStatusAggregatesQuery>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetPassengerStatusAggregatesQuery) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: query.tripId },
    });
    if (!trip) {
      throw new NotFoundException({
        message: "Trip not found",
        code: "NOT_FOUND",
      });
    }
    const passengers = await this.prisma.passenger.findMany({
      where: {
        tripId: query.tripId,
        ...(query.includeRemoved ? {} : { removedAt: null }),
      },
      include: {
        payments: { select: { amountMinor: true } },
      },
    });
    let pendingCount = 0;
    let settledPaymentsCount = 0;
    let settledManualCount = 0;
    let unavailableCount = 0;
    for (const p of passengers) {
      const row = mapPassengerWithStatus(p, trip, p.payments);
      switch (row.status) {
        case "pending":
          pendingCount += 1;
          break;
        case "settled_payments":
          settledPaymentsCount += 1;
          break;
        case "settled_manual":
          settledManualCount += 1;
          break;
        case "unavailable":
          unavailableCount += 1;
          break;
        default:
          break;
      }
    }
    return {
      pendingCount,
      settledPaymentsCount,
      settledManualCount,
      unavailableCount,
    };
  }
}
