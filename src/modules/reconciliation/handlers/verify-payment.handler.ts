import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { VerifyPaymentCommand } from '../commands';
import { ReconciliationService } from '../reconciliation.service';

@CommandHandler(VerifyPaymentCommand)
export class VerifyPaymentHandler implements ICommandHandler<VerifyPaymentCommand> {
  constructor(private readonly reconciliation: ReconciliationService) {}

  execute(command: VerifyPaymentCommand) {
    return this.reconciliation.verify(command.paymentId, command.userId);
  }
}
