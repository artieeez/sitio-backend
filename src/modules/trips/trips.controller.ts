import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthProxyGuard } from '../../common/auth-proxy/auth-proxy.guard';
import { TripsService } from './trips.service';

@Controller('v1')
@UseGuards(AuthProxyGuard)
export class TripsController {
  constructor(private readonly trips: TripsService) {}

  @Get('schools/:schoolId/trips')
  async listBySchool(@Param('schoolId') schoolId: string) {
    const items = await this.trips.listBySchool(schoolId);
    return { items };
  }

  @Get('trips/:tripId/passengers/status')
  async passengerStatus(@Param('tripId') tripId: string) {
    return this.trips.passengerStatus(tripId);
  }
}
