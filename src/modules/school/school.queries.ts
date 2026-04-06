export class ListSchoolsQuery {
  constructor(public readonly includeInactive: boolean) {}
}

export class GetSchoolQuery {
  constructor(public readonly schoolId: string) {}
}
