import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { PrismaModule } from "../../prisma/prisma.module";
import { PassengerPaymentsController } from "./passenger-payments.controller";
import {
  CreatePaymentHandler,
  DeletePaymentHandler,
  UpdatePaymentHandler,
} from "./payment.command-handlers";
import { ListPaymentsForPassengerHandler } from "./payment.query-handlers";
import { PaymentByIdController } from "./payment-by-id.controller";

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [PassengerPaymentsController, PaymentByIdController],
  providers: [
    CreatePaymentHandler,
    UpdatePaymentHandler,
    DeletePaymentHandler,
    ListPaymentsForPassengerHandler,
  ],
})
export class PaymentModule {}
