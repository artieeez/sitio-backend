import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { PrismaModule } from "../../prisma/prisma.module";
import { SchoolTripsController } from "./school-trips.controller";
import { CreateTripHandler, UpdateTripHandler } from "./trip.command-handlers";
import { TripController } from "./trip.controller";
import {
  GetTripHandler,
  ListTripsForSchoolHandler,
} from "./trip.query-handlers";

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [SchoolTripsController, TripController],
  providers: [
    CreateTripHandler,
    UpdateTripHandler,
    ListTripsForSchoolHandler,
    GetTripHandler,
  ],
})
export class TripModule {}
