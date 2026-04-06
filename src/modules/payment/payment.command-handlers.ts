import { ConflictException, NotFoundException } from "@nestjs/common";
import { CommandHandler, type ICommandHandler } from "@nestjs/cqrs";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreatePaymentCommand,
  DeletePaymentCommand,
  UpdatePaymentCommand,
} from "./payment.commands";
import { mapPayment, parseDateOnlyToUtc } from "./payment.mapper";

@CommandHandler(CreatePaymentCommand)
export class CreatePaymentHandler
  implements ICommandHandler<CreatePaymentCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreatePaymentCommand) {
    const passenger = await this.prisma.passenger.findUnique({
      where: { id: command.passengerId },
    });
    if (!passenger) {
      throw new NotFoundException({
        message: "Passenger not found",
        code: "NOT_FOUND",
      });
    }
    if (passenger.removedAt !== null) {
      throw new ConflictException({
        message: "Passenger removed — cannot create payment",
        code: "PASSENGER_REMOVED",
      });
    }

    const paidOn = parseDateOnlyToUtc(command.dto.paidOn);
    const payment = await this.prisma.payment.create({
      data: {
        passengerId: command.passengerId,
        amountMinor: command.dto.amountMinor,
        paidOn,
        location: command.dto.location.trim(),
        payerIdentity: command.dto.payerIdentity.trim(),
      },
    });
    return mapPayment(payment);
  }
}

@CommandHandler(UpdatePaymentCommand)
export class UpdatePaymentHandler
  implements ICommandHandler<UpdatePaymentCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdatePaymentCommand) {
    const existing = await this.prisma.payment.findUnique({
      where: { id: command.paymentId },
    });
    if (!existing) {
      throw new NotFoundException({
        message: "Payment not found",
        code: "NOT_FOUND",
      });
    }

    const paidOn = parseDateOnlyToUtc(command.dto.paidOn);
    const payment = await this.prisma.payment.update({
      where: { id: command.paymentId },
      data: {
        amountMinor: command.dto.amountMinor,
        paidOn,
        location: command.dto.location.trim(),
        payerIdentity: command.dto.payerIdentity.trim(),
      },
    });
    return mapPayment(payment);
  }
}

@CommandHandler(DeletePaymentCommand)
export class DeletePaymentHandler
  implements ICommandHandler<DeletePaymentCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeletePaymentCommand): Promise<void> {
    const existing = await this.prisma.payment.findUnique({
      where: { id: command.paymentId },
    });
    if (!existing) {
      throw new NotFoundException({
        message: "Payment not found",
        code: "NOT_FOUND",
      });
    }
    await this.prisma.payment.delete({ where: { id: command.paymentId } });
  }
}
