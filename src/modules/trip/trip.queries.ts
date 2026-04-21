export class ListTripsForSchoolQuery {
  constructor(
    public readonly schoolId: string,
    public readonly includeInactive: boolean,
  ) {}
}

export class GetTripQuery {
  constructor(public readonly tripId: string) {}
}

export class GetPassengerStatusAggregatesQuery {
  constructor(
    public readonly tripId: string,
    public readonly includeRemoved: boolean,
  ) {}
}

export class GetTripDeleteEligibilityQuery {
  constructor(public readonly tripId: string) {}
}
