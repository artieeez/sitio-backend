import { NotFoundException } from "@nestjs/common";
import { type IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../prisma/prisma.service";
import { mapPassengerWithStatus } from "./passenger.mapper";
import { ListPassengersForTripQuery } from "./passenger.queries";

@QueryHandler(ListPassengersForTripQuery)
export class ListPassengersForTripHandler
  implements IQueryHandler<ListPassengersForTripQuery>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListPassengersForTripQuery) {
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
      orderBy: { fullName: "asc" },
      include: {
        payments: { select: { amountMinor: true } },
      },
    });
    return passengers.map((p) => mapPassengerWithStatus(p, trip, p.payments));
  }
}
