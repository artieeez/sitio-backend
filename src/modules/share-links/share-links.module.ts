import { Module } from '@nestjs/common';
import { ShareLinkAuthGuard } from '../../common/auth-proxy/share-link-auth.guard';
import { ShareLinksController } from './share-links.controller';
import { ShareLinksService } from './share-links.service';

@Module({
  controllers: [ShareLinksController],
  providers: [ShareLinksService, ShareLinkAuthGuard],
})
export class ShareLinksModule {}
