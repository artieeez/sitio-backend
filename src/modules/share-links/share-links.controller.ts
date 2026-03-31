import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import {
  AuthProxyGuard,
  InternalUserContext,
} from '../../common/auth-proxy/auth-proxy.guard';
import {
  ShareLinkAuthGuard,
  ShareLinkContext,
} from '../../common/auth-proxy/share-link-auth.guard';
import { CreateShareLinkDto } from './dto/create-share-link.dto';
import { ShareLinksService } from './share-links.service';

@Controller('v1/share-links')
export class ShareLinksController {
  constructor(private readonly shareLinks: ShareLinksService) {}

  @Post()
  @UseGuards(AuthProxyGuard)
  async create(
    @Req() req: Request & { internalUser: InternalUserContext },
    @Body() body: CreateShareLinkDto,
  ) {
    const expiresAt = new Date(body.expiresAt);
    const result = await this.shareLinks.create(req.internalUser.userId, {
      scopeType: body.scopeType,
      tripId: body.tripId,
      schoolId: body.schoolId,
      expiresAt,
    });
    const { rawToken, ...rest } = result;
    return {
      ...rest,
      token: rawToken,
    };
  }

  @Post(':linkId/revoke')
  @UseGuards(AuthProxyGuard)
  async revoke(
    @Req() req: Request & { internalUser: InternalUserContext },
    @Param('linkId') linkId: string,
  ) {
    return this.shareLinks.revoke(linkId, req.internalUser.userId);
  }

  @Get('access/trip')
  @UseGuards(ShareLinkAuthGuard)
  async accessTrip(@Req() req: Request & { shareLink: ShareLinkContext }) {
    return this.shareLinks.accessTrip(req.shareLink);
  }

  @Get('access/school')
  @UseGuards(ShareLinkAuthGuard)
  async accessSchool(@Req() req: Request & { shareLink: ShareLinkContext }) {
    return this.shareLinks.accessSchool(req.shareLink);
  }
}
