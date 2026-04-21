import {
  BadGatewayException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PatchWixIntegrationDto } from "./dto/patch-wix-integration.dto";
import {
  toWixCollectionSummaryDto,
} from "./wix-collection.mapper";
import {
  toWixProductSummaryDto,
} from "./wix-product.mapper";
import { WixApiService } from "./wix-api.service";
import { WixIntegrationService } from "./wix-integration.service";

/** Dashboard + clients: tenant-wide Wix keys (`GET`/`PATCH` under global `/api` prefix). */
@Controller("integrations/wix")
export class WixIntegrationController {
  constructor(
    private readonly wixIntegration: WixIntegrationService,
    private readonly wixApi: WixApiService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getSettings() {
    return this.wixIntegration.getSettings();
  }

  @Patch()
  patchSettings(@Body() dto: PatchWixIntegrationDto) {
    return this.wixIntegration.patchSettings(dto);
  }

  /** Autocomplete: products in the school’s Wix collection by name prefix (`queryProducts`). */
  @Get("products/autocomplete")
  async productsAutocomplete(
    @Query("schoolId", new ParseUUIDPipe()) schoolId: string,
    @Query("prefix") prefix?: string,
  ) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });
    if (!school) {
      throw new NotFoundException({ message: "School not found" });
    }
    const collectionId = school.wixCollectionId?.trim();
    if (!collectionId) {
      return { products: [] };
    }
    const res = await this.wixApi.searchProductsInCollectionByPrefix(
      collectionId,
      prefix ?? "",
    );
    const items = res.products
      .map((p) => toWixProductSummaryDto(p))
      .filter((x): x is NonNullable<typeof x> => x != null);
    return { products: items };
  }

  /** Full product summary for form fill (`getProduct`). */
  @Get("products/:productId")
  async getWixProduct(@Param("productId") productId: string) {
    const raw = await this.wixApi.getProduct(productId.trim());
    const dto = toWixProductSummaryDto(raw.product);
    if (!dto) {
      throw new BadGatewayException("Wix product payload is invalid");
    }
    return dto;
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
