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
import { PassengerCreateDto } from "./dto/passenger-create.dto";
import { CreatePassengerCommand } from "./passenger.commands";
import { ListPassengersForTripQuery } from "./passenger.queries";

@Controller("trips/:tripId/passengers")
export class TripPassengersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  list(
    @Param("tripId", ParseUUIDPipe) tripId: string,
    @Query("includeRemoved") includeRemoved?: string,
  ) {
    return this.queryBus.execute(
      new ListPassengersForTripQuery(tripId, includeRemoved === "true"),
    );
  }

  @Post()
  create(
    @Param("tripId", ParseUUIDPipe) tripId: string,
    @Body() dto: PassengerCreateDto,
  ) {
    return this.commandBus.execute(new CreatePassengerCommand(tripId, dto));
  }
}
