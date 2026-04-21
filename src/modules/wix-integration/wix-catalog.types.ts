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
