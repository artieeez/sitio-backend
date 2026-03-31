import { Injectable } from '@nestjs/common';
import { FlagTargetType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FlagsService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    userId: string,
    body: {
      targetType: 'PASSENGER' | 'PAYMENT_RECORD';
      targetId: string;
      reason: string;
    },
  ) {
    return this.prisma.flag.create({
      data: {
        targetType: body.targetType as FlagTargetType,
        targetId: body.targetId,
        reason: body.reason,
        createdByUserId: userId,
      },
    });
  }
}
