import {
  BadGatewayException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import type {
  GetProductOptions,
  GetProductResponse,
} from "./wix-catalog.types";

const STORES_READER_BASE = "https://www.wixapis.com/stores-reader/v1";
const WIX_INTEGRATION_SINGLETON_ID = 1;

@Injectable()
export class WixApiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * GET /stores-reader/v1/products/{id}
   * @see https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/catalog/get-product
   */
  async getProduct(
    productId: string,
    options?: GetProductOptions,
  ): Promise<GetProductResponse> {
    const id = productId.trim();
    if (!id) {
      throw new BadGatewayException("Wix product id is required");
    }

    const apiKey = await this.resolvePrivateApiKey();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        "Wix API key is not configured (set WIX_PRIVATE_API_KEY or store privateApiKey in Wix integration settings)",
      );
    }

    const url = new URL(
      `${STORES_READER_BASE}/products/${encodeURIComponent(id)}`,
    );
    if (options?.includeMerchantSpecificData != null) {
      url.searchParams.set(
        "includeMerchantSpecificData",
        String(options.includeMerchantSpecificData),
      );
    }

    const headers = this.buildAuthHeaders(apiKey);

    const res = await fetch(url, { method: "GET", headers });

    const bodyText = await res.text();
    let bodyJson: unknown;
    try {
      bodyJson = bodyText.length > 0 ? JSON.parse(bodyText) : null;
    } catch {
      bodyJson = null;
    }

    if (res.status === 404) {
      throw new NotFoundException(
        typeof bodyJson === "object" && bodyJson !== null
          ? JSON.stringify(bodyJson)
          : "Wix product not found",
      );
    }

    if (!res.ok) {
      throw new BadGatewayException(
        `Wix getProduct failed (${res.status}): ${bodyText.slice(0, 2000)}`,
      );
    }

    const data = bodyJson as Partial<GetProductResponse> | null;
    if (!data?.product || typeof data.product !== "object") {
      throw new BadGatewayException("Wix getProduct returned an invalid body");
    }

    return data as GetProductResponse;
  }

  private async resolvePrivateApiKey(): Promise<string | null> {
    const fromEnv = this.config.get<string>("WIX_PRIVATE_API_KEY");
    if (fromEnv != null && fromEnv.trim() !== "") {
      return fromEnv.trim();
    }

    const row = await this.prisma.wixIntegration.findUnique({
      where: { id: WIX_INTEGRATION_SINGLETON_ID },
    });
    const fromDb = row?.privateApiKey?.trim();
    return fromDb && fromDb.length > 0 ? fromDb : null;
  }

  private buildAuthHeaders(apiKey: string): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: apiKey,
      Accept: "application/json",
    };

    const siteId = this.config.get<string>("WIX_SITE_ID")?.trim();
    if (siteId) {
      headers["wix-site-id"] = siteId;
    }

    return headers;
  }
}
