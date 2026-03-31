import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthProxyGuard } from '../../common/auth-proxy/auth-proxy.guard';
import { SchoolsService } from './schools.service';

@Controller('v1/schools')
@UseGuards(AuthProxyGuard)
export class SchoolsController {
  constructor(private readonly schools: SchoolsService) {}

  @Get()
  async list() {
    const items = await this.schools.list();
    return { items };
  }
}
