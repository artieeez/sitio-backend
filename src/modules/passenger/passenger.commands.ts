import type { ManualPaidWithoutInfoDto } from "./dto/manual-paid-without-info.dto";
import type { PassengerCreateDto } from "./dto/passenger-create.dto";
import type { PassengerUpdateDto } from "./dto/passenger-update.dto";

export class CreatePassengerCommand {
  constructor(
    public readonly tripId: string,
    public readonly dto: PassengerCreateDto,
  ) {}
}

export class UpdatePassengerCommand {
  constructor(
    public readonly passengerId: string,
    public readonly dto: PassengerUpdateDto,
  ) {}
}

export class SetManualPaidWithoutInfoCommand {
  constructor(
    public readonly passengerId: string,
    public readonly dto: ManualPaidWithoutInfoDto,
  ) {}
}
