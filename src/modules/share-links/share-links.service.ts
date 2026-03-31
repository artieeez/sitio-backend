import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ShareLinkScopeType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { generateShareToken, hashShareToken } from './share-token.util';

@Injectable()
export class ShareLinksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    dto: {
      scopeType: ShareLinkScopeType;
      tripId?: string;
      schoolId?: string;
      expiresAt: Date;
    },
  ) {
    if (dto.scopeType === 'TRIP' && !dto.tripId) {
      throw new BadRequestException('tripId required for TRIP scope');
    }
    if (dto.scopeType === 'SCHOOL' && !dto.schoolId) {
      throw new BadRequestException('schoolId required for SCHOOL scope');
    }
    if (dto.scopeType === 'TRIP' && dto.schoolId) {
      throw new BadRequestException('schoolId must be empty for TRIP scope');
    }
    if (dto.scopeType === 'SCHOOL' && dto.tripId) {
      throw new BadRequestException('tripId must be empty for SCHOOL scope');
    }
    const raw = generateShareToken();
    const tokenHash = hashShareToken(raw);
    const link = await this.prisma.shareLink.create({
      data: {
        tokenHash,
        scopeType: dto.scopeType,
        tripId: dto.scopeType === 'TRIP' ? dto.tripId! : null,
        schoolId: dto.scopeType === 'SCHOOL' ? dto.schoolId! : null,
        expiresAt: dto.expiresAt,
        createdByUserId: userId,
      },
    });
    const url =
      link.scopeType === 'TRIP'
        ? `/share/trip?token=${encodeURIComponent(raw)}`
        : `/share/school?token=${encodeURIComponent(raw)}`;
    return {
      id: link.id,
      url,
      expiresAt: link.expiresAt.toISOString(),
      scopeType: link.scopeType,
      rawToken: raw,
    };
  }

  async revoke(linkId: string, _userId: string) {
    const link = await this.prisma.shareLink.findUnique({
      where: { id: linkId },
    });
    if (!link) {
      throw new BadRequestException('Link not found');
    }
    await this.prisma.shareLink.update({
      where: { id: linkId },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  private toSharePassenger(p: {
    id: string;
    fullName: string;
    paymentStatus: string;
    documentStatus: string;
    isFlagged: boolean;
  }) {
    return {
      id: p.id,
      fullName: p.fullName,
      paymentStatus: p.paymentStatus,
      documentStatus: p.documentStatus,
      flagged: p.isFlagged,
    };
  }

  async accessTrip(ctx: {
    shareLinkId: string;
    tripId: string | null;
    schoolId: string | null;
    scopeType: 'TRIP' | 'SCHOOL';
  }) {
    if (ctx.scopeType !== 'TRIP' || !ctx.tripId) {
      throw new ForbiddenException('Trip scope required');
    }
    const trip = await this.prisma.trip.findUnique({
      where: { id: ctx.tripId },
      include: {
        passengers: {
          where: { lifecycle: 'ACTIVE' },
          orderBy: { fullName: 'asc' },
        },
      },
    });
    if (!trip) {
      throw new BadRequestException('Trip not found');
    }
    return {
      trip: {
        id: trip.id,
        schoolId: trip.schoolId,
        title: trip.title,
      },
      passengers: trip.passengers.map((p) => this.toSharePassenger(p)),
    };
  }

  async accessSchool(ctx: {
    shareLinkId: string;
    tripId: string | null;
    schoolId: string | null;
    scopeType: 'TRIP' | 'SCHOOL';
  }) {
    if (ctx.scopeType !== 'SCHOOL' || !ctx.schoolId) {
      throw new ForbiddenException('School scope required');
    }
    const trips = await this.prisma.trip.findMany({
      where: { schoolId: ctx.schoolId },
      orderBy: { title: 'asc' },
      include: {
        passengers: {
          where: { lifecycle: 'ACTIVE' },
          orderBy: { fullName: 'asc' },
        },
      },
    });
    return {
      schoolId: ctx.schoolId,
      trips: trips.map((t) => ({
        trip: {
          id: t.id,
          schoolId: t.schoolId,
          title: t.title,
        },
        passengers: t.passengers.map((p) => this.toSharePassenger(p)),
      })),
    };
  }
}
