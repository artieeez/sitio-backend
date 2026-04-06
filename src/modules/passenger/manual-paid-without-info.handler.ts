import { NotFoundException } from "@nestjs/common";
import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../prisma/prisma.service";
import { SetManualPaidWithoutInfoCommand } from "./passenger.commands";
import { mapPassengerWithStatus } from "./passenger.mapper";

@CommandHandler(SetManualPaidWithoutInfoCommand)
export class SetManualPaidWithoutInfoHandler
  implements ICommandHandler<SetManualPaidWithoutInfoCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: SetManualPaidWithoutInfoCommand) {
    const existing = await this.prisma.passenger.findUnique({
      where: { id: command.passengerId },
    });
    if (!existing) {
      throw new NotFoundException({
        message: "Passenger not found",
        code: "NOT_FOUND",
      });
    }
    const trip = await this.prisma.trip.findUnique({
      where: { id: existing.tripId },
    });
    if (!trip) {
      throw new NotFoundException({
        message: "Trip not found",
        code: "NOT_FOUND",
      });
    }

    const passenger = await this.prisma.passenger.update({
      where: { id: command.passengerId },
      data: { manualPaidWithoutInfo: command.dto.enabled },
    });
    const payments = await this.prisma.payment.findMany({
      where: { passengerId: passenger.id },
      select: { amountMinor: true },
    });
    return mapPassengerWithStatus(passenger, trip, payments);
  }
}
