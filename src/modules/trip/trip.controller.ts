import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { TripUpdateDto } from "./dto/trip-update.dto";
import { UpdateTripCommand } from "./trip.commands";
import { GetTripQuery } from "./trip.queries";

@Controller("trips")
export class TripController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(":tripId")
  get(@Param("tripId", ParseUUIDPipe) tripId: string) {
    return this.queryBus.execute(new GetTripQuery(tripId));
  }

  @Patch(":tripId")
  update(
    @Param("tripId", ParseUUIDPipe) tripId: string,
    @Body() dto: TripUpdateDto,
  ) {
    return this.commandBus.execute(new UpdateTripCommand(tripId, dto));
  }
}
