import {
  Body,
  Controller,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthProxyGuard } from '../../common/auth-proxy/auth-proxy.guard';
import { ManualPassengerDto } from './dto/manual-passenger.dto';
import { PassengersService } from './passengers.service';

@Controller('v1/trips/:tripId/passengers')
@UseGuards(AuthProxyGuard)
export class PassengersController {
  constructor(private readonly passengers: PassengersService) {}

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importFile(
    @Param('tripId') tripId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('mode') mode: 'preview' | 'commit' = 'preview',
  ) {
    if (!file?.buffer) {
      return {
        ok: false,
        summary: 'Missing file',
        rowErrors: [{ row: 0, message: 'file is required' }],
      };
    }
    const m = mode === 'commit' ? 'commit' : 'preview';
    return this.passengers.importPassengers(tripId, file.buffer, file.mimetype, m);
  }

  @Post()
  async manual(
    @Param('tripId') tripId: string,
    @Body() body: ManualPassengerDto,
  ) {
    const p = await this.passengers.addManual(tripId, body);
    return p;
  }
}
