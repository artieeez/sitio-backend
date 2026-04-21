import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { PrismaModule } from "../../prisma/prisma.module";
import { SchoolTripsController } from "./school-trips.controller";
import {
  CreateTripHandler,
  DeleteTripHandler,
  UpdateTripHandler,
} from "./trip.command-handlers";
import { TripController } from "./trip.controller";
import {
  GetPassengerStatusAggregatesHandler,
  GetTripDeleteEligibilityHandler,
  GetTripHandler,
  ListTripsForSchoolHandler,
} from "./trip.query-handlers";

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [SchoolTripsController, TripController],
  providers: [
    CreateTripHandler,
    UpdateTripHandler,
    DeleteTripHandler,
    ListTripsForSchoolHandler,
    GetTripHandler,
    GetPassengerStatusAggregatesHandler,
    GetTripDeleteEligibilityHandler,
  ],
})
export class TripModule {}
