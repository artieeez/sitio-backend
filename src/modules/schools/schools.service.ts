import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.school.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
