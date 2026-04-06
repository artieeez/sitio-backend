import { NotFoundException } from "@nestjs/common";
import { type IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../prisma/prisma.service";
import { mapPayment } from "./payment.mapper";
import { ListPaymentsForPassengerQuery } from "./payment.queries";

@QueryHandler(ListPaymentsForPassengerQuery)
export class ListPaymentsForPassengerHandler
  implements IQueryHandler<ListPaymentsForPassengerQuery>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListPaymentsForPassengerQuery) {
    const passenger = await this.prisma.passenger.findUnique({
      where: { id: query.passengerId },
    });
    if (!passenger) {
      throw new NotFoundException({
        message: "Passenger not found",
        code: "NOT_FOUND",
      });
    }
    const rows = await this.prisma.payment.findMany({
      where: { passengerId: query.passengerId },
      orderBy: [{ paidOn: "asc" }, { createdAt: "asc" }],
    });
    return rows.map(mapPayment);
  }
}
