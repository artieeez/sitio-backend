import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentRecordStatus } from '@prisma/client';
import { CommandBus } from '@nestjs/cqrs';
import { Request } from 'express';
import {
  AuthProxyGuard,
  InternalUserContext,
} from '../../common/auth-proxy/auth-proxy.guard';
import {
  MatchPaymentCommand,
  ReassignPaymentCommand,
  VerifyPaymentCommand,
} from './commands';
import { ReconciliationService } from './reconciliation.service';
import { FlagsService } from './flags.service';

@Controller('v1')
@UseGuards(AuthProxyGuard)
export class ReconciliationController {
  constructor(
    private readonly reconciliation: ReconciliationService,
    private readonly commandBus: CommandBus,
    private readonly flags: FlagsService,
  ) {}

  @Get('reconciliation/payments')
  async list(@Query('status') status?: PaymentRecordStatus) {
    const items = await this.reconciliation.list(status);
    return {
      items: items.map((p) => ({
        id: p.id,
        integrationSource: p.integrationSource,
        externalPaymentId: p.externalPaymentId,
        status: p.status,
        matchedPassengerId: p.matchedPassengerId,
        tripId: p.tripId,
        suspectedDuplicate: p.suspectedDuplicates.length > 0,
      })),
    };
  }

  @Post('reconciliation/payments/:paymentId/match')
  async match(
    @Req() req: Request & { internalUser: InternalUserContext },
    @Param('paymentId') paymentId: string,
    @Body() body: { passengerId: string; reason: string },
  ) {
    return this.commandBus.execute(
      new MatchPaymentCommand(
        paymentId,
        body.passengerId,
        req.internalUser.userId,
        body.reason,
      ),
    );
  }

  @Post('reconciliation/payments/:paymentId/verify')
  async verify(
    @Req() req: Request & { internalUser: InternalUserContext },
    @Param('paymentId') paymentId: string,
  ) {
    return this.commandBus.execute(
      new VerifyPaymentCommand(paymentId, req.internalUser.userId),
    );
  }

  @Post('reconciliation/payments/:paymentId/reassign')
  async reassign(
    @Req() req: Request & { internalUser: InternalUserContext },
    @Param('paymentId') paymentId: string,
    @Body() body: { toPassengerId: string; reason: string },
  ) {
    return this.commandBus.execute(
      new ReassignPaymentCommand(
        paymentId,
        body.toPassengerId,
        req.internalUser.userId,
        body.reason,
      ),
    );
  }

  @Post('reconciliation/payments/:paymentId/create-passenger')
  async createPassenger(
    @Req() req: Request & { internalUser: InternalUserContext },
    @Param('paymentId') paymentId: string,
    @Body()
    body: { tripId: string; fullName: string; studentDocument?: string },
  ) {
    return this.reconciliation.createPassengerFromPayment(
      paymentId,
      req.internalUser.userId,
      body,
    );
  }

  @Post('trips/:tripId/payments/manual')
  async manualPayment(
    @Req() req: Request & { internalUser: InternalUserContext },
    @Param('tripId') tripId: string,
    @Body()
    body: {
      externalPaymentId: string;
      amount?: string;
      currency?: string;
    },
  ) {
    return this.reconciliation.createManualPayment(
      tripId,
      req.internalUser.userId,
      body,
    );
  }

  @Post('flags')
  async createFlag(
    @Req() req: Request & { internalUser: InternalUserContext },
    @Body()
    body: {
      targetType: 'PASSENGER' | 'PAYMENT_RECORD';
      targetId: string;
      reason: string;
    },
  ) {
    return this.flags.create(req.internalUser.userId, body);
  }
}
