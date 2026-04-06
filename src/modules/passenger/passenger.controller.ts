import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
} from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { ManualPaidWithoutInfoDto } from "./dto/manual-paid-without-info.dto";
import { PassengerUpdateDto } from "./dto/passenger-update.dto";
import {
  SetManualPaidWithoutInfoCommand,
  UpdatePassengerCommand,
} from "./passenger.commands";

@Controller("passengers")
export class PassengerController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(":passengerId")
  update(
    @Param("passengerId", ParseUUIDPipe) passengerId: string,
    @Body() dto: PassengerUpdateDto,
  ) {
    return this.commandBus.execute(
      new UpdatePassengerCommand(passengerId, dto),
    );
  }

  @Put(":passengerId/manual-paid-without-info")
  setManualPaidWithoutInfo(
    @Param("passengerId", ParseUUIDPipe) passengerId: string,
    @Body() dto: ManualPaidWithoutInfoDto,
  ) {
    return this.commandBus.execute(
      new SetManualPaidWithoutInfoCommand(passengerId, dto),
    );
  }
}
