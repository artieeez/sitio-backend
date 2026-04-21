import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { WixApiService } from "./wix-api.service";
import { WixIntegrationController } from "./wix-integration.controller";
import { WixIntegrationService } from "./wix-integration.service";

@Module({
  imports: [PrismaModule],
  controllers: [WixIntegrationController],
  providers: [WixIntegrationService, WixApiService],
  exports: [WixApiService],
})
export class WixIntegrationModule {}
