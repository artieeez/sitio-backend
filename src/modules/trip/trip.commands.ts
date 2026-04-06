import type { TripCreateDto } from "./dto/trip-create.dto";
import type { TripUpdateDto } from "./dto/trip-update.dto";

export class CreateTripCommand {
  constructor(
    public readonly schoolId: string,
    public readonly dto: TripCreateDto,
  ) {}
}

export class UpdateTripCommand {
  constructor(
    public readonly tripId: string,
    public readonly dto: TripUpdateDto,
  ) {}
}
