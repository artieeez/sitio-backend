import { NotFoundException } from "@nestjs/common";
import { type IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../prisma/prisma.service";
import { mapTrip } from "./trip.mapper";
import { GetTripQuery, ListTripsForSchoolQuery } from "./trip.queries";

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
