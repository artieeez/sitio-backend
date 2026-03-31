import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MatchPaymentCommand } from '../commands';
import { ReconciliationService } from '../reconciliation.service';

@CommandHandler(MatchPaymentCommand)
export class MatchPaymentHandler implements ICommandHandler<MatchPaymentCommand> {
  constructor(private readonly reconciliation: ReconciliationService) {}

  execute(command: MatchPaymentCommand) {
    return this.reconciliation.match(
      command.paymentId,
      command.passengerId,
      command.userId,
      command.reason,
    );
  }
}
