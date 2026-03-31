/**
 * Share-link access (T010): validates `x-share-link-authenticated`, Bearer token,
 * and scope via token hash lookup — implemented as a guard (Nest middleware equivalent).
 */
import {
  CanActivate,
  ExecutionContext,
  GoneException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { HEADER_SHARE_LINK_AUTH } from '../constants';
import { hashShareToken } from '../../modules/share-links/share-token.util';

export type ShareLinkContext = {
  shareLinkId: string;
  scopeType: 'TRIP' | 'SCHOOL';
  tripId: string | null;
  schoolId: string | null;
};

@Injectable()
export class ShareLinkAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    if (req.headers[HEADER_SHARE_LINK_AUTH] !== 'true') {
      throw new UnauthorizedException('Share link header required');
    }
    const auth = req.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (!token) {
      throw new UnauthorizedException('Bearer token required');
    }
    const tokenHash = hashShareToken(token);
    const link = await this.prisma.shareLink.findUnique({
      where: { tokenHash },
    });
    if (!link) {
      throw new UnauthorizedException('Invalid share link');
    }
    const now = new Date();
    if (link.revokedAt) {
      throw new GoneException('Share link revoked');
    }
    if (link.expiresAt <= now) {
      throw new GoneException('Share link expired');
    }
    (req as Request & { shareLink: ShareLinkContext }).shareLink = {
      shareLinkId: link.id,
      scopeType: link.scopeType,
      tripId: link.tripId,
      schoolId: link.schoolId,
    };
    return true;
  }
}
