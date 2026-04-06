import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { PrismaModule } from "../../prisma/prisma.module";
import { SetManualPaidWithoutInfoHandler } from "./manual-paid-without-info.handler";
import {
  CreatePassengerHandler,
  UpdatePassengerHandler,
} from "./passenger.command-handlers";
import { PassengerController } from "./passenger.controller";
import { ListPassengersForTripHandler } from "./queries/list-passengers-for-trip.handler";
import { TripPassengersController } from "./trip-passengers.controller";

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [TripPassengersController, PassengerController],
  providers: [
    CreatePassengerHandler,
    UpdatePassengerHandler,
    SetManualPaidWithoutInfoHandler,
    ListPassengersForTripHandler,
  ],
})
export class PassengerModule {}
