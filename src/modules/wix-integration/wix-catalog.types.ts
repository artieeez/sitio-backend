/** Shapes aligned with Wix Stores catalog reader GetProduct (subset). */

export type GetProductOptions = {
  /** Requires permissions to manage products. */
  includeMerchantSpecificData?: boolean;
};

export type WixFormattedPrice = {
  price?: string;
  discountedPrice?: string;
  pricePerUnit?: string;
};

export type WixPriceData = {
  currency?: string;
  price?: number;
  discountedPrice?: number;
  formatted?: WixFormattedPrice;
  pricePerUnit?: number;
};

export type WixStock = {
  trackInventory?: boolean;
  quantity?: number;
  inventoryStatus?: string;
  inStock?: boolean;
};

/** REST uses `id`; JS SDK responses may use `_id`. */
export type WixCatalogProduct = {
  id?: string;
  _id?: string;
  name?: string;
  slug?: string;
  visible?: boolean;
  productType?: string;
  description?: string;
  sku?: string;
  weight?: number;
  stock?: WixStock;
  priceData?: WixPriceData;
  media?: unknown;
  variants?: unknown[];
  manageVariants?: boolean;
};

export type GetProductResponse = {
  product: WixCatalogProduct;
};

/** @see https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-versioning/get-catalog-version */
export type WixCatalogVersionKind =
  | "V1_CATALOG"
  | "V3_CATALOG"
  | "STORES_NOT_INSTALLED";

export type GetCatalogVersionResponse = {
  catalogVersion: WixCatalogVersionKind;
};

/** @see https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/catalog/query-collections */
export type QueryCollectionsQuery = {
  paging?: { limit?: number; offset?: number };
  /** Wix API Query Language filter string (REST). */
  filter?: string;
  /** Sort string (REST). */
  sort?: string;
};

export type QueryCollectionsRequest = {
  query: QueryCollectionsQuery | Record<string, unknown>;
  includeDescription?: boolean;
  includeNumberOfProducts?: boolean;
};

export type WixStoreCollection = {
  id?: string;
  _id?: string;
  name?: string;
  slug?: string;
  visible?: boolean;
  description?: string | null;
  numberOfProducts?: number;
  media?: unknown;
};

export type QueryCollectionsResponse = {
  collections: WixStoreCollection[];
  metadata?: unknown;
  totalResults?: number;
  /** Present in some SDK-shaped responses. */
  pagingMetadata?: unknown;
  totalCount?: number;
};

/** @see https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/catalog/create-collection */
export type CreateCollectionCollectionInput = {
  name: string;
  description?: string;
  slug?: string;
  visible?: boolean;
};

export type CreateCollectionRequest = {
  collection: CreateCollectionCollectionInput;
};

export type CreateCollectionResponse = {
  collection: WixStoreCollection;
};
