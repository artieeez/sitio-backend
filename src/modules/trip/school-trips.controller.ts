import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { TripCreateDto } from "./dto/trip-create.dto";
import { CreateTripCommand } from "./trip.commands";
import { ListTripsForSchoolQuery } from "./trip.queries";

@Controller("schools/:schoolId/trips")
export class SchoolTripsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  list(
    @Param("schoolId", ParseUUIDPipe) schoolId: string,
    @Query("includeInactive") includeInactive?: string,
  ) {
    return this.queryBus.execute(
      new ListTripsForSchoolQuery(schoolId, includeInactive === "true"),
    );
  }

  @Post()
  create(
    @Param("schoolId", ParseUUIDPipe) schoolId: string,
    @Body() dto: TripCreateDto,
  ) {
    return this.commandBus.execute(new CreateTripCommand(schoolId, dto));
  }
}
