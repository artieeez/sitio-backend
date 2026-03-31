import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ReassignPaymentCommand } from '../commands';
import { ReconciliationService } from '../reconciliation.service';

@CommandHandler(ReassignPaymentCommand)
export class ReassignPaymentHandler
  implements ICommandHandler<ReassignPaymentCommand>
{
  constructor(private readonly reconciliation: ReconciliationService) {}

  execute(command: ReassignPaymentCommand) {
    return this.reconciliation.reassign(
      command.paymentId,
      command.toPassengerId,
      command.userId,
      command.reason,
    );
  }
}
