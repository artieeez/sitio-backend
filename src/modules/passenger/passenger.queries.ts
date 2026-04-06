export class ListPassengersForTripQuery {
  constructor(
    public readonly tripId: string,
    public readonly includeRemoved: boolean,
  ) {}
}
