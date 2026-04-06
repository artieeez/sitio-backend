export class ListTripsForSchoolQuery {
  constructor(
    public readonly schoolId: string,
    public readonly includeInactive: boolean,
  ) {}
}

export class GetTripQuery {
  constructor(public readonly tripId: string) {}
}
