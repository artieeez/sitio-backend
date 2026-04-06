import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { PaymentCreateDto } from "./dto/payment-create.dto";
import { CreatePaymentCommand } from "./payment.commands";
import { ListPaymentsForPassengerQuery } from "./payment.queries";

@Controller("passengers")
export class PassengerPaymentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(":passengerId/payments")
  list(@Param("passengerId", ParseUUIDPipe) passengerId: string) {
    return this.queryBus.execute(
      new ListPaymentsForPassengerQuery(passengerId),
    );
  }

  @Post(":passengerId/payments")
  create(
    @Param("passengerId", ParseUUIDPipe) passengerId: string,
    @Body() dto: PaymentCreateDto,
  ) {
    return this.commandBus.execute(new CreatePaymentCommand(passengerId, dto));
  }
}
