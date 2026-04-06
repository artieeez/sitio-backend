import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
} from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { PaymentUpdateDto } from "./dto/payment-update.dto";
import { DeletePaymentCommand, UpdatePaymentCommand } from "./payment.commands";

@Controller("payments")
export class PaymentByIdController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(":paymentId")
  update(
    @Param("paymentId", ParseUUIDPipe) paymentId: string,
    @Body() dto: PaymentUpdateDto,
  ) {
    return this.commandBus.execute(new UpdatePaymentCommand(paymentId, dto));
  }

  @Delete(":paymentId")
  @HttpCode(204)
  remove(@Param("paymentId", ParseUUIDPipe) paymentId: string) {
    return this.commandBus.execute(new DeletePaymentCommand(paymentId));
  }
}
