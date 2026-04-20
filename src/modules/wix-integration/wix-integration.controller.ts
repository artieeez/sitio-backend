import { Body, Controller, Get, Patch } from "@nestjs/common";
import { PatchWixIntegrationDto } from "./dto/patch-wix-integration.dto";
import { WixIntegrationService } from "./wix-integration.service";

@Controller("integrations/wix")
export class WixIntegrationController {
  constructor(private readonly wixIntegration: WixIntegrationService) {}

  @Get()
  getSettings() {
    return this.wixIntegration.getSettings();
  }

  @Patch()
  patchSettings(@Body() dto: PatchWixIntegrationDto) {
    return this.wixIntegration.patchSettings(dto);
  }
}
