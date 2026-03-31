import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import {
  HEADER_AUTH_USER_ID,
  HEADER_AUTH_USER_NAME,
  HEADER_SHARE_LINK_AUTH,
} from '../constants';

export type InternalUserContext = { userId: string; username: string };

@Injectable()
export class AuthProxyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const share = req.headers[HEADER_SHARE_LINK_AUTH];
    if (share === 'true') {
      throw new UnauthorizedException('Use share-link auth for this route');
    }
    const userId = req.headers[HEADER_AUTH_USER_ID];
    const username = req.headers[HEADER_AUTH_USER_NAME];
    if (!userId || typeof userId !== 'string') {
      throw new UnauthorizedException('Missing internal user id');
    }
    if (!username || typeof username !== 'string') {
      throw new UnauthorizedException('Missing internal user name');
    }
    await this.prisma.staff.upsert({
      where: { id: userId },
      update: { username },
      create: { id: userId, username },
    });
    (req as Request & { internalUser: InternalUserContext }).internalUser = {
      userId,
      username,
    };
    return true;
  }
}
