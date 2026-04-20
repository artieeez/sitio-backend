import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { WixIntegrationController } from "./wix-integration.controller";
import { WixIntegrationService } from "./wix-integration.service";

@Module({
  imports: [PrismaModule],
  controllers: [WixIntegrationController],
  providers: [WixIntegrationService],
})
export class WixIntegrationModule {}
