# Bruno: Wix API (manual exploration)

Use [Bruno](https://www.usebruno.com/) to call Wix REST endpoints **before** wiring them in Nest (`src/modules/wix-integration/wix-api.service.ts`).

## Open this collection

1. Install Bruno (desktop or VS Code extension).
2. **Open Collection** → choose this folder: `sitio-backend/bruno/wix-api`.

## Configure `Local` environment

In Bruno, select environment **Local** and set:

| Variable | Purpose |
|----------|---------|
| `wixApiKey` | Private API key or OAuth access token (same idea as `WIX_PRIVATE_API_KEY` / dashboard “private” key). Sent as the raw `Authorization` header, matching `WixApiService.buildAuthHeaders`. |
| `wixSiteId` | Site GUID for requests that need the `wix-site-id` header (same as `WIX_SITE_ID` in the backend). Used by **Get Product (with wix-site-id)**, **Create Collection (with wix-site-id)**, etc. |
| `productId` | Product GUID to fetch. |
| `collectionNamePrefix` | Prefix for **Query Collections (autocomplete by name)** — drives `$startsWith` on `name` (WQL). |
| `collectionAutocompleteLimit` | Page size for that request (default `20`). |
| `wixStoresReaderBaseUrl` | Default `https://www.wixapis.com/stores-reader/v1` — change only if Wix updates the base path. |
| `wixStoresV1BaseUrl` | Default `https://www.wixapis.com/stores/v1` for **Create Collection** (`POST .../collections`). |
| `newCollectionName` | Name for **Create Collection** requests. |
| `newCollectionDescription` / `newCollectionSlug` | Optional fields for **Create Collection (optional fields)**. |
| `wixStoresV3ProvisionBaseUrl` | Default `https://www.wixapis.com/stores/v3/provision` for **Get Catalog Version** (`GET .../version`). |
| `wixStoresV3ProductsBaseUrl` | Default `https://www.wixapis.com/stores/v3/products` for **Catalog V3 Get Product** (`GET .../products/{productId}`). |

**Do not commit real secrets.** Prefer Bruno’s secret variables or keep keys only in your local Bruno app.

## Requests

- **Get Product** — `includeMerchantSpecificData=false`, no `wix-site-id` (matches the common Nest path when `WIX_SITE_ID` is unset).
- **Get Product (merchant data)** — `includeMerchantSpecificData=true` (needs extra permissions).
- **Get Product (with wix-site-id)** — same as Get Product but sends `wix-site-id` (matches Nest when `WIX_SITE_ID` is set).
- **Query Collections** — [`queryCollections`](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/catalog/query-collections): `POST /stores-reader/v1/collections/query` (scope `SCOPE.DC-STORES.READ-PRODUCTS`). **`Query Collections (minimal)`** sends `{ "query": {} }`; **`Query Collections (description + counts)`** sets `includeDescription` and `includeNumberOfProducts`; **`Query Collections (with wix-site-id)`** adds the site header. **`Query Collections (autocomplete by name)`** uses a string [`filter`](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/catalog/filter-and-sort.md) with `$startsWith` on `name`, `sort` by `name` ascending, and small `paging.limit` — mirror this in Nest when wiring collection pickers.
- **Create Collection** — [`createCollection`](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/catalog/create-collection): `POST /stores/v1/collections` (scope `SCOPE.DC-STORES.MANAGE-PRODUCTS`). Write API uses **`stores/v1`**, not `stores-reader`. **`Create Collection (minimal)`** sends `{ "collection": { "name": "..." } }`; **`Create Collection (optional fields)`** adds `description`, `slug`, `visible`; **`Create Collection (with wix-site-id)`** sends the site header.
- **stores-provision-v3 / Get Catalog Version** — [`getCatalogVersion`](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-versioning/get-catalog-version): `GET /stores/v3/provision/version` (scope `STORES.CATALOG_READ_LIMITED`). Optional **`Get Catalog Version (with wix-site-id)`** when the site header is required.
- **stores-catalog-v3** — [`getProduct` (Catalog V3)](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3/products-v3/get-product): `GET /stores/v3/products/{productId}`. Scopes: `STORES.PRODUCT_READ` (and `PRODUCT_READ_ADMIN` for non-visible products / merchant fields). **`Get Product (minimal)`** has no `fields` query; **`Get Product (sample fields)`** repeats `fields=...` per Wix docs; **`Get Product (with wix-site-id)`** adds `wix-site-id` if your auth needs site context.

Add more `.bru` files under new folders as you explore additional Wix APIs.

## Nest parity

When a call works here, port the same URL, query string, and headers into `WixApiService` (or a new method), reusing `resolvePrivateApiKey()` and `WIX_SITE_ID` from config where applicable.
