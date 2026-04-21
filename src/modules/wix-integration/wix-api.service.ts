import {
  BadGatewayException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  GetCatalogVersionResponse,
  GetProductOptions,
  GetProductResponse,
  QueryCollectionsRequest,
  QueryCollectionsResponse,
  WixCatalogVersionKind,
} from "./wix-catalog.types";
import { WixIntegrationService } from "./wix-integration.service";

const STORES_READER_BASE = "https://www.wixapis.com/stores-reader/v1";
const STORES_V3_PROVISION_BASE = "https://www.wixapis.com/stores/v3/provision";

const CATALOG_VERSION_KINDS: readonly WixCatalogVersionKind[] = [
  "V1_CATALOG",
  "V3_CATALOG",
  "STORES_NOT_INSTALLED",
];

@Injectable()
export class WixApiService {
  constructor(
    private readonly wixIntegration: WixIntegrationService,
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

    const apiKey = await this.wixIntegration.resolvePrivateApiKey();
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

  /**
   * GET /stores/v3/provision/version
   * @see https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-versioning/get-catalog-version
   */
  async getCatalogVersion(): Promise<GetCatalogVersionResponse> {
    const apiKey = await this.wixIntegration.resolvePrivateApiKey();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        "Wix API key is not configured (set WIX_PRIVATE_API_KEY or store privateApiKey in Wix integration settings)",
      );
    }

    const url = new URL(`${STORES_V3_PROVISION_BASE}/version`);
    const headers = this.buildAuthHeaders(apiKey);
    const res = await fetch(url, { method: "GET", headers });

    const bodyText = await res.text();
    let bodyJson: unknown;
    try {
      bodyJson = bodyText.length > 0 ? JSON.parse(bodyText) : null;
    } catch {
      bodyJson = null;
    }

    if (!res.ok) {
      throw new BadGatewayException(
        `Wix getCatalogVersion failed (${res.status}): ${bodyText.slice(0, 2000)}`,
      );
    }

    const data = bodyJson as Partial<GetCatalogVersionResponse> | null;
    const v = data?.catalogVersion;
    if (
      typeof v !== "string" ||
      !CATALOG_VERSION_KINDS.includes(v as WixCatalogVersionKind)
    ) {
      throw new BadGatewayException(
        "Wix getCatalogVersion returned an invalid body",
      );
    }

    return { catalogVersion: v as WixCatalogVersionKind };
  }

  /**
   * POST /stores-reader/v1/collections/query
   * @see https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/catalog/query-collections
   */
  async queryCollections(
    body: QueryCollectionsRequest,
  ): Promise<QueryCollectionsResponse> {
    const apiKey = await this.wixIntegration.resolvePrivateApiKey();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        "Wix API key is not configured (set WIX_PRIVATE_API_KEY or store privateApiKey in Wix integration settings)",
      );
    }

    const url = new URL(`${STORES_READER_BASE}/collections/query`);
    const headers: Record<string, string> = {
      ...this.buildAuthHeaders(apiKey),
      "Content-Type": "application/json",
    };

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const bodyText = await res.text();
    let bodyJson: unknown;
    try {
      bodyJson = bodyText.length > 0 ? JSON.parse(bodyText) : null;
    } catch {
      bodyJson = null;
    }

    if (!res.ok) {
      throw new BadGatewayException(
        `Wix queryCollections failed (${res.status}): ${bodyText.slice(0, 2000)}`,
      );
    }

    const data = bodyJson as Partial<QueryCollectionsResponse> | null;
    if (!data || !Array.isArray(data.collections)) {
      throw new BadGatewayException(
        "Wix queryCollections returned an invalid body",
      );
    }

    return data as QueryCollectionsResponse;
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
