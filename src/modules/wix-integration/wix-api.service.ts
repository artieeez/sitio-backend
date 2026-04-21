import {
  BadGatewayException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import type {
  CreateCollectionRequest,
  CreateCollectionResponse,
  DeleteCollectionResponse,
  GetCatalogVersionResponse,
  GetProductOptions,
  GetProductResponse,
  QueryCollectionsRequest,
  QueryCollectionsResponse,
  QueryProductsRequest,
  QueryProductsResponse,
  WixCatalogVersionKind,
  WixStoreCollection,
} from "./wix-catalog.types";
import { WixIntegrationService } from "./wix-integration.service";

const STORES_READER_BASE = "https://www.wixapis.com/stores-reader/v1";
const STORES_V1_BASE = "https://www.wixapis.com/stores/v1";
const STORES_V3_PROVISION_BASE = "https://www.wixapis.com/stores/v3/provision";

const CATALOG_VERSION_KINDS: readonly WixCatalogVersionKind[] = [
  "V1_CATALOG",
  "V3_CATALOG",
  "STORES_NOT_INSTALLED",
];

@Injectable()
export class WixApiService {
  constructor(private readonly wixIntegration: WixIntegrationService) {}

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

    const headers = await this.buildAuthHeaders(apiKey);

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
    const headers = await this.buildAuthHeaders(apiKey);
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
      ...(await this.buildAuthHeaders(apiKey)),
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

  /**
   * POST /stores-reader/v1/products/query
   * @see https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/catalog/query-products
   *
   * WQL examples (filter is a JSON string): e.g. products in a collection
   * `JSON.stringify({ "collections.id": { $in: [collectionId] } })`.
   */
  async queryProducts(
    body: QueryProductsRequest,
  ): Promise<QueryProductsResponse> {
    const apiKey = await this.wixIntegration.resolvePrivateApiKey();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        "Wix API key is not configured (set WIX_PRIVATE_API_KEY or store privateApiKey in Wix integration settings)",
      );
    }

    const url = new URL(`${STORES_READER_BASE}/products/query`);
    const headers: Record<string, string> = {
      ...(await this.buildAuthHeaders(apiKey)),
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
        `Wix queryProducts failed (${res.status}): ${bodyText.slice(0, 2000)}`,
      );
    }

    const data = bodyJson as Partial<QueryProductsResponse> | null;
    if (!data || !Array.isArray(data.products)) {
      throw new BadGatewayException(
        "Wix queryProducts returned an invalid body",
      );
    }

    return data as QueryProductsResponse;
  }

  /** Default autocomplete when the user has not typed a prefix: most recently updated in collection. */
  private static readonly PRODUCT_AUTOCOMPLETE_RECENT_LIMIT = 5;

  /**
   * Products in `collectionId` whose `name` starts with `prefix` (case-insensitive).
   * Empty `prefix`: the five most recently updated products in the collection (Wix `lastUpdated` desc).
   * Non-empty prefix: collection filter plus client-side prefix match (max 50 scanned, 20 returned).
   */
  async searchProductsInCollectionByPrefix(
    collectionId: string,
    prefix: string,
  ): Promise<QueryProductsResponse> {
    const id = collectionId.trim();
    if (!id) {
      throw new BadGatewayException("Wix collection id is required");
    }
    const filter = JSON.stringify({
      "collections.id": { $in: [id] },
    });
    const p = prefix.trim().toLowerCase();
    if (p.length === 0) {
      return this.queryProducts({
        query: {
          filter,
          sort: '[{"lastUpdated":"desc"}]',
          paging: {
            limit: WixApiService.PRODUCT_AUTOCOMPLETE_RECENT_LIMIT,
            offset: 0,
          },
        },
        includeVariants: false,
      });
    }
    const res = await this.queryProducts({
      query: {
        filter,
        sort: '[{"name":"asc"}]',
        paging: { limit: 50, offset: 0 },
      },
      includeVariants: false,
    });
    const products = res.products
      .filter((prod) => (prod.name ?? "").toLowerCase().startsWith(p))
      .slice(0, 20);
    return { ...res, products };
  }

  /**
   * Collections whose `name` starts with `prefix` (empty prefix → empty list, no request).
   */
  async searchCollectionsByPrefix(
    prefix: string,
  ): Promise<QueryCollectionsResponse> {
    const p = prefix.trim();
    if (p.length === 0) {
      return { collections: [] };
    }
    return this.queryCollections({
      query: {
        filter: JSON.stringify({ name: { $startsWith: p } }),
        sort: '[{"name":"asc"}]',
        paging: { limit: 20, offset: 0 },
      },
      includeDescription: true,
      includeNumberOfProducts: true,
    });
  }

  /**
   * Single collection by id via query filter.
   */
  async getCollectionById(
    collectionId: string,
  ): Promise<WixStoreCollection | null> {
    const id = collectionId.trim();
    if (!id) {
      throw new BadGatewayException("Wix collection id is required");
    }
    const res = await this.queryCollections({
      query: {
        filter: JSON.stringify({ id: { $eq: id } }),
        paging: { limit: 1, offset: 0 },
      },
      includeDescription: true,
      includeNumberOfProducts: true,
    });
    return res.collections[0] ?? null;
  }

  /**
   * POST /stores/v1/collections
   * @see https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/catalog/create-collection
   */
  async createCollection(
    body: CreateCollectionRequest,
  ): Promise<CreateCollectionResponse> {
    const name = body.collection?.name?.trim();
    if (!name) {
      throw new BadGatewayException("Wix collection name is required");
    }

    const apiKey = await this.wixIntegration.resolvePrivateApiKey();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        "Wix API key is not configured (set WIX_PRIVATE_API_KEY or store privateApiKey in Wix integration settings)",
      );
    }

    const url = new URL(`${STORES_V1_BASE}/collections`);
    const headers: Record<string, string> = {
      ...(await this.buildAuthHeaders(apiKey)),
      "Content-Type": "application/json",
    };

    const payload: CreateCollectionRequest = {
      collection: {
        ...body.collection,
        name,
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
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
        `Wix createCollection failed (${res.status}): ${bodyText.slice(0, 2000)}`,
      );
    }

    const data = bodyJson as Partial<CreateCollectionResponse> | null;
    if (!data?.collection || typeof data.collection !== "object") {
      throw new BadGatewayException(
        "Wix createCollection returned an invalid body",
      );
    }

    return data as CreateCollectionResponse;
  }

  /**
   * DELETE /stores/v1/collections/{id}
   * @see https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/catalog/delete-collection
   */
  async deleteCollection(
    collectionId: string,
  ): Promise<DeleteCollectionResponse> {
    const id = collectionId.trim();
    if (!id) {
      throw new BadGatewayException("Wix collection id is required");
    }

    const apiKey = await this.wixIntegration.resolvePrivateApiKey();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        "Wix API key is not configured (set WIX_PRIVATE_API_KEY or store privateApiKey in Wix integration settings)",
      );
    }

    const url = new URL(
      `${STORES_V1_BASE}/collections/${encodeURIComponent(id)}`,
    );
    const headers = await this.buildAuthHeaders(apiKey);

    const res = await fetch(url, { method: "DELETE", headers });

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
          : "Wix collection not found",
      );
    }

    if (!res.ok) {
      throw new BadGatewayException(
        `Wix deleteCollection failed (${res.status}): ${bodyText.slice(0, 2000)}`,
      );
    }

    if (bodyText.length === 0) {
      return {};
    }

    if (
      typeof bodyJson !== "object" ||
      bodyJson === null ||
      Array.isArray(bodyJson)
    ) {
      throw new BadGatewayException(
        "Wix deleteCollection returned an invalid body",
      );
    }

    return bodyJson as DeleteCollectionResponse;
  }

  private async buildAuthHeaders(
    apiKey: string,
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      Authorization: apiKey,
      Accept: "application/json",
    };

    const siteId = await this.wixIntegration.resolveSiteId();
    if (siteId) {
      headers["wix-site-id"] = siteId;
    }

    return headers;
  }
}
