import { ICommand } from '@nestjs/cqrs';

export class MatchPaymentCommand implements ICommand {
  constructor(
    public readonly paymentId: string,
    public readonly passengerId: string,
    public readonly userId: string,
    public readonly reason: string,
  ) {}
}

export class VerifyPaymentCommand implements ICommand {
  constructor(
    public readonly paymentId: string,
    public readonly userId: string,
  ) {}
}

export class ReassignPaymentCommand implements ICommand {
  constructor(
    public readonly paymentId: string,
    public readonly toPassengerId: string,
    public readonly userId: string,
    public readonly reason: string,
  ) {}
}
