import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MatchPaymentHandler } from './handlers/match-payment.handler';
import { ReassignPaymentHandler } from './handlers/reassign-payment.handler';
import { VerifyPaymentHandler } from './handlers/verify-payment.handler';
import { ReconciliationController } from './reconciliation.controller';
import { ReconciliationService } from './reconciliation.service';
import { FlagsService } from './flags.service';

const handlers = [
  MatchPaymentHandler,
  VerifyPaymentHandler,
  ReassignPaymentHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [ReconciliationController],
  providers: [ReconciliationService, FlagsService, ...handlers],
})
export class ReconciliationModule {}
