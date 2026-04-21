import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { TripUpdateDto } from "./dto/trip-update.dto";
import { DeleteTripCommand, UpdateTripCommand } from "./trip.commands";
import {
  GetPassengerStatusAggregatesQuery,
  GetTripDeleteEligibilityQuery,
  GetTripQuery,
} from "./trip.queries";

@Controller("trips")
export class TripController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(":tripId/passenger-status-aggregates")
  passengerStatusAggregates(
    @Param("tripId", ParseUUIDPipe) tripId: string,
    @Query("includeRemoved") includeRemoved?: string,
  ) {
    return this.queryBus.execute(
      new GetPassengerStatusAggregatesQuery(tripId, includeRemoved === "true"),
    );
  }

  @Get(":tripId/delete-eligibility")
  deleteEligibility(@Param("tripId", ParseUUIDPipe) tripId: string) {
    return this.queryBus.execute(new GetTripDeleteEligibilityQuery(tripId));
  }

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

  @Delete(":tripId")
  remove(@Param("tripId", ParseUUIDPipe) tripId: string) {
    return this.commandBus.execute(new DeleteTripCommand(tripId));
  }
}
