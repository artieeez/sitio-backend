import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateTripCommand,
  DeleteTripCommand,
  UpdateTripCommand,
} from "./trip.commands";
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
    const collectionId = school.wixCollectionId?.trim();
    if (!collectionId) {
      throw new BadRequestException({
        message:
          "Configure a Wix collection for the school before creating a trip",
        code: "SCHOOL_WIX_COLLECTION_REQUIRED",
      });
    }
    const wixProductId = dto.wixProductId?.trim();
    if (!wixProductId) {
      throw new BadRequestException({
        message: "Select a Wix product for the trip",
        code: "WIX_PRODUCT_REQUIRED",
      });
    }
    const trip = await this.prisma.trip.create({
      data: {
        schoolId,
        wixProductId,
        wixProductSlug: dto.wixProductSlug?.trim() ?? null,
        wixProductPageUrl: dto.wixProductPageUrl?.trim() ?? null,
        defaultExpectedAmountMinor: dto.defaultExpectedAmountMinor ?? null,
        title: dto.title ?? null,
        description: dto.description ?? null,
        imageUrl: dto.imageUrl ?? null,
        active: dto.active ?? true,
      },
    });
    return mapTrip(trip);
  }
}

@CommandHandler(DeleteTripCommand)
export class DeleteTripHandler implements ICommandHandler<DeleteTripCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteTripCommand): Promise<void> {
    const { tripId } = command;
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });
    if (!trip) {
      throw new NotFoundException({
        message: "Trip not found",
        code: "NOT_FOUND",
      });
    }
    const passengerCount = await this.prisma.passenger.count({
      where: { tripId },
    });
    if (passengerCount > 0) {
      throw new ConflictException({
        message: "Remove all passengers before deleting the trip",
        code: "TRIP_HAS_PASSENGERS",
      });
    }
    await this.prisma.trip.delete({ where: { id: tripId } });
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
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
    });
    return mapTrip(trip);
  }
}
