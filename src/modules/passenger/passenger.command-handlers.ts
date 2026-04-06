import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from "@nestjs/common";
import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CpfValidationError, normalizeCpfInput } from "./cpf.util";
import { normalizeFullNameForMatch } from "./name-normalize.util";
import {
  CreatePassengerCommand,
  UpdatePassengerCommand,
} from "./passenger.commands";
import { mapPassengerWithStatus } from "./passenger.mapper";
import { normalizePhoneNumber } from "./phone-normalize.util";

async function hasDuplicateNameOnTrip(
  prisma: PrismaService,
  tripId: string,
  fullName: string,
  excludePassengerId?: string,
): Promise<boolean> {
  const target = normalizeFullNameForMatch(fullName);
  const rows = await prisma.passenger.findMany({
    where: { tripId },
    select: { id: true, fullName: true },
  });
  for (const r of rows) {
    if (excludePassengerId && r.id === excludePassengerId) {
      continue;
    }
    if (normalizeFullNameForMatch(r.fullName) === target) {
      return true;
    }
  }
  return false;
}

@CommandHandler(CreatePassengerCommand)
export class CreatePassengerHandler
  implements ICommandHandler<CreatePassengerCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreatePassengerCommand) {
    const { tripId, dto } = command;
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      throw new NotFoundException({
        message: "Trip not found",
        code: "NOT_FOUND",
      });
    }
    if (!trip.active) {
      throw new ConflictException({
        message: "Trip inactive — cannot create passenger",
        code: "TRIP_INACTIVE",
      });
    }

    let cpfNormalized: string | null;
    try {
      cpfNormalized = normalizeCpfInput(dto.cpf ?? null);
    } catch (e) {
      if (e instanceof CpfValidationError) {
        throw new BadRequestException({
          message: "Invalid CPF",
          code: "BAD_REQUEST",
        });
      }
      throw e;
    }

    const confirm = dto.confirmNameDuplicate === true;
    if (
      await hasDuplicateNameOnTrip(this.prisma, tripId, dto.fullName, undefined)
    ) {
      if (!confirm) {
        throw new HttpException(
          {
            message: "Duplicate passenger name on trip; confirm to proceed",
            code: "NAME_DUPLICATE_WARNING",
          },
          HttpStatus.PRECONDITION_REQUIRED,
        );
      }
    }

    try {
      const passenger = await this.prisma.passenger.create({
        data: {
          tripId,
          fullName: dto.fullName.trim(),
          cpfNormalized,
          parentName: dto.parentName?.trim() || null,
          parentPhoneNumber: normalizePhoneNumber(dto.parentPhoneNumber),
          parentEmail: dto.parentEmail?.trim() || null,
          expectedAmountOverrideMinor: dto.expectedAmountOverrideMinor ?? null,
        },
      });
      const payments = await this.prisma.payment.findMany({
        where: { passengerId: passenger.id },
        select: { amountMinor: true },
      });
      return mapPassengerWithStatus(passenger, trip, payments);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new ConflictException({
          message: "Duplicate CPF on trip",
          code: "DUPLICATE_CPF",
        });
      }
      throw e;
    }
  }
}

@CommandHandler(UpdatePassengerCommand)
export class UpdatePassengerHandler
  implements ICommandHandler<UpdatePassengerCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdatePassengerCommand) {
    const { passengerId, dto } = command;
    const existing = await this.prisma.passenger.findUnique({
      where: { id: passengerId },
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

    const nextFullName =
      dto.fullName !== undefined ? dto.fullName.trim() : existing.fullName;
    const confirm = dto.confirmNameDuplicate === true;
    if (
      dto.fullName !== undefined &&
      (await hasDuplicateNameOnTrip(
        this.prisma,
        existing.tripId,
        nextFullName,
        passengerId,
      ))
    ) {
      if (!confirm) {
        throw new HttpException(
          {
            message: "Duplicate passenger name on trip; confirm to proceed",
            code: "NAME_DUPLICATE_WARNING",
          },
          HttpStatus.PRECONDITION_REQUIRED,
        );
      }
    }

    let cpfNormalized = existing.cpfNormalized;
    if (dto.cpf !== undefined) {
      try {
        cpfNormalized = normalizeCpfInput(dto.cpf);
      } catch (e) {
        if (e instanceof CpfValidationError) {
          throw new BadRequestException({
            message: "Invalid CPF",
            code: "BAD_REQUEST",
          });
        }
        throw e;
      }
    }

    let removedAt = existing.removedAt;
    if (dto.removed === true) {
      removedAt = new Date();
    } else if (dto.removed === false) {
      removedAt = null;
    }

    try {
      const passenger = await this.prisma.passenger.update({
        where: { id: passengerId },
        data: {
          ...(dto.fullName !== undefined && { fullName: dto.fullName.trim() }),
          ...(dto.cpf !== undefined && { cpfNormalized }),
          ...(dto.parentName !== undefined && {
            parentName: dto.parentName?.trim() || null,
          }),
          ...(dto.parentPhoneNumber !== undefined && {
            parentPhoneNumber: normalizePhoneNumber(dto.parentPhoneNumber),
          }),
          ...(dto.parentEmail !== undefined && {
            parentEmail: dto.parentEmail?.trim() || null,
          }),
          ...(dto.expectedAmountOverrideMinor !== undefined && {
            expectedAmountOverrideMinor: dto.expectedAmountOverrideMinor,
          }),
          ...(dto.removed !== undefined && { removedAt }),
        },
      });
      const payments = await this.prisma.payment.findMany({
        where: { passengerId: passenger.id },
        select: { amountMinor: true },
      });
      return mapPassengerWithStatus(passenger, trip, payments);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new ConflictException({
          message: "Duplicate CPF on trip",
          code: "DUPLICATE_CPF",
        });
      }
      throw e;
    }
  }
}
