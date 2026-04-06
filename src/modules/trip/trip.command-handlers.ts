import { ConflictException, NotFoundException } from "@nestjs/common";
import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTripCommand, UpdateTripCommand } from "./trip.commands";
import { mapTrip } from "./trip.mapper";

@CommandHandler(CreateTripCommand)
export class CreateTripHandler implements ICommandHandler<CreateTripCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateTripCommand) {
    const { schoolId, dto } = command;
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });
    if (!school) {
      throw new NotFoundException({
        message: "School not found",
        code: "NOT_FOUND",
      });
    }
    if (!school.active) {
      throw new ConflictException({
        message: "School inactive — cannot create trip",
        code: "SCHOOL_INACTIVE",
      });
    }
    const trip = await this.prisma.trip.create({
      data: {
        schoolId,
        defaultExpectedAmountMinor: dto.defaultExpectedAmountMinor ?? null,
        url: dto.url ?? null,
        title: dto.title ?? null,
        description: dto.description ?? null,
        imageUrl: dto.imageUrl ?? null,
        faviconUrl: dto.faviconUrl ?? null,
        active: dto.active ?? true,
      },
    });
    return mapTrip(trip);
  }
}

@CommandHandler(UpdateTripCommand)
export class UpdateTripHandler implements ICommandHandler<UpdateTripCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateTripCommand) {
    const { tripId, dto } = command;
    const existing = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });
    if (!existing) {
      throw new NotFoundException({
        message: "Trip not found",
        code: "NOT_FOUND",
      });
    }
    const trip = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        ...(dto.defaultExpectedAmountMinor !== undefined && {
          defaultExpectedAmountMinor: dto.defaultExpectedAmountMinor,
        }),
        ...(dto.url !== undefined && { url: dto.url }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.faviconUrl !== undefined && { faviconUrl: dto.faviconUrl }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
    });
    return mapTrip(trip);
  }
}
