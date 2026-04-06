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
  UpdateSchoolCommand,
} from "./school.commands";
import { GetSchoolQuery, ListSchoolsQuery } from "./school.queries";

@Controller("schools")
export class SchoolController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
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

  @Delete(":schoolId")
  @HttpCode(204)
  deactivate(@Param("schoolId", ParseUUIDPipe) schoolId: string) {
    return this.commandBus.execute(new DeactivateSchoolCommand(schoolId));
  }
}
