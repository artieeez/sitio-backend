import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { SchoolCreateDto } from "./dto/school-create.dto";
import { SchoolUpdateDto } from "./dto/school-update.dto";
import {
  CreateSchoolCommand,
  DeactivateSchoolCommand,
  DeleteSchoolCommand,
  UpdateSchoolCommand,
} from "./school.commands";
import { SchoolDeletionService } from "./school-deletion.service";
import { GetSchoolQuery, ListSchoolsQuery } from "./school.queries";

@Controller("schools")
export class SchoolController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly schoolDeletionService: SchoolDeletionService,
  ) {}

  @Get()
  list(@Query("includeInactive") includeInactive?: string) {
    return this.queryBus.execute(
      new ListSchoolsQuery(includeInactive === "true"),
    );
  }

  @Post()
  create(@Body() dto: SchoolCreateDto) {
    return this.commandBus.execute(new CreateSchoolCommand(dto));
  }

  @Get(":schoolId/delete-eligibility")
  getDeleteEligibility(
    @Param("schoolId", ParseUUIDPipe) schoolId: string,
  ) {
    return this.schoolDeletionService.getDeleteEligibility(schoolId);
  }

  @Get(":schoolId")
  get(@Param("schoolId", ParseUUIDPipe) schoolId: string) {
    return this.queryBus.execute(new GetSchoolQuery(schoolId));
  }

  @Patch(":schoolId")
  update(
    @Param("schoolId", ParseUUIDPipe) schoolId: string,
    @Body() dto: SchoolUpdateDto,
  ) {
    return this.commandBus.execute(new UpdateSchoolCommand(schoolId, dto));
  }

  @Post(":schoolId/deactivate")
  @HttpCode(204)
  deactivate(@Param("schoolId", ParseUUIDPipe) schoolId: string) {
    return this.commandBus.execute(new DeactivateSchoolCommand(schoolId));
  }

  @Delete(":schoolId")
  @HttpCode(204)
  delete(@Param("schoolId", ParseUUIDPipe) schoolId: string) {
    return this.commandBus.execute(new DeleteSchoolCommand(schoolId));
  }
}
