import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
} from "@nestjs/common";
import { PatchWixIntegrationDto } from "./dto/patch-wix-integration.dto";
import {
  toWixCollectionSummaryDto,
} from "./wix-collection.mapper";
import { WixApiService } from "./wix-api.service";
import { WixIntegrationService } from "./wix-integration.service";

/** Dashboard + clients: tenant-wide Wix keys (`GET`/`PATCH` under global `/api` prefix). */
@Controller("integrations/wix")
export class WixIntegrationController {
  constructor(
    private readonly wixIntegration: WixIntegrationService,
    private readonly wixApi: WixApiService,
  ) {}

  @Get()
  getSettings() {
    return this.wixIntegration.getSettings();
  }

  @Patch()
  patchSettings(@Body() dto: PatchWixIntegrationDto) {
    return this.wixIntegration.patchSettings(dto);
  }

  /** Autocomplete: collections by name prefix (Wix `queryCollections`). */
  @Get("collections/autocomplete")
  async collectionsAutocomplete(@Query("prefix") prefix?: string) {
    const res = await this.wixApi.searchCollectionsByPrefix(prefix ?? "");
    const items = res.collections
      .map((c) => toWixCollectionSummaryDto(c))
      .filter((x): x is NonNullable<typeof x> => x != null);
    return { collections: items };
  }

  /** Single collection summary for display (name, image, slug, visibility, product count). */
  @Get("collections/:collectionId")
  async getCollection(@Param("collectionId") collectionId: string) {
    const raw = await this.wixApi.getCollectionById(collectionId);
    const dto = raw ? toWixCollectionSummaryDto(raw) : null;
    if (!dto) {
      throw new NotFoundException({ message: "Wix collection not found" });
    }
    return dto;
  }
}
