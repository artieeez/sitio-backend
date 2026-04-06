import type { PaymentCreateDto } from "./dto/payment-create.dto";
import type { PaymentUpdateDto } from "./dto/payment-update.dto";

export class CreatePaymentCommand {
  constructor(
    public readonly passengerId: string,
    public readonly dto: PaymentCreateDto,
  ) {}
}

export class UpdatePaymentCommand {
  constructor(
    public readonly paymentId: string,
    public readonly dto: PaymentUpdateDto,
  ) {}
}

export class DeletePaymentCommand {
  constructor(public readonly paymentId: string) {}
}
