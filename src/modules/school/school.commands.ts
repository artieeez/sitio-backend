import type { SchoolCreateDto } from "./dto/school-create.dto";
import type { SchoolUpdateDto } from "./dto/school-update.dto";

export class CreateSchoolCommand {
  constructor(public readonly dto: SchoolCreateDto) {}
}

export class UpdateSchoolCommand {
  constructor(
    public readonly schoolId: string,
    public readonly dto: SchoolUpdateDto,
  ) {}
}

export class DeactivateSchoolCommand {
  constructor(public readonly schoolId: string) {}
}
