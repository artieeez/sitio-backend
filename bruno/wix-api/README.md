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
| `wixSiteId` | **Required** for every request in this collection: sent as `wix-site-id` (same as `WIX_SITE_ID` in the backend). Set `WIX_SITE_ID` when comparing with Nest. |
| `productId` | Product GUID to fetch. |
| `collectionNamePrefix` | Prefix for **Query Collections (autocomplete by name)** — drives `$startsWith` on `name` (WQL). |
| `collectionAutocompleteLimit` | Page size for that request (default `20`). |
| `wixStoresReaderBaseUrl` | Default `https://www.wixapis.com/stores-reader/v1` — change only if Wix updates the base path. |
| `wixStoresV1BaseUrl` | Default `https://www.wixapis.com/stores/v1` for **Create Collection** (`POST .../collections`) and **Delete Collection** (`DELETE .../collections/{id}`). |
| `collectionId` | Collection GUID for **Delete Collection** (set to a real id before calling). |
| `newCollectionName` | Name for **Create Collection**. |
| `productsQueryLimit` | Page size for **Query Products (by collection)** (default `20`). |
| `wixStoresV3ProvisionBaseUrl` | Default `https://www.wixapis.com/stores/v3/provision` for **Get Catalog Version** (`GET .../version`). |
| `wixStoresV3ProductsBaseUrl` | Default `https://www.wixapis.com/stores/v3/products` for **Catalog V3 Get Product** (`GET .../products/{productId}`). |
| `wixSiteMediaV1BaseUrl` | Default `https://www.wixapis.com/site-media/v1` for **Generate File Upload URL** (`POST .../files/generate-upload-url`). |
| `wixMediaMimeType` | `mimeType` for that request (e.g. `image/jpeg`). |
| `wixMediaUploadFileName` | Optional display / type hint filename (e.g. `T-shirt.jpg`). |
| `wixMediaSizeInBytes` | Optional file size in bytes (number). |

**Do not commit real secrets.** Prefer Bruno’s secret variables or keep keys only in your local Bruno app.

## Requests

All requests below include the **`wix-site-id`** header.

- **stores-catalog-v1 / Get Product** — [`getProduct`](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/catalog/get-product): `GET /stores-reader/v1/products/{productId}` with `includeMerchantSpecificData=false`. Toggle the param in the request if you need merchant data.
- **stores-catalog-v1 / Query Collections** — [`queryCollections`](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/catalog/query-collections): `POST /stores-reader/v1/collections/query` (scope `SCOPE.DC-STORES.READ-PRODUCTS`). **`Query Collections (minimal)`** sends `{ "query": {} }`. **`Query Collections (autocomplete by name)`** uses a string [`filter`](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/catalog/filter-and-sort.md) with `$startsWith` on `name`, `sort` by `name` ascending, `includeDescription` / `includeNumberOfProducts`, and `paging.limit`.
- **stores-catalog-v1 / Query Products** — [`queryProducts`](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/catalog/query-products): `POST /stores-reader/v1/products/query` (scope `SCOPE.DC-STORES.READ-PRODUCTS`, “Read products”). **`Query Products (minimal)`** sends `{ "query": {} }`. **`Query Products (by collection)`** filters with WQL on [`collections.id`](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/catalog/filter-and-sort.md) (`$in` with `collectionId`), `sort` by `name` asc, `paging`, and `includeVariants: false`. Set `includeVariants` / `includeHiddenProducts` / `includeMerchantSpecificData` in the body as needed.
- **stores-catalog-v1 / Create Collection** — [`createCollection`](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/catalog/create-collection): `POST /stores/v1/collections` (scope `SCOPE.DC-STORES.MANAGE-PRODUCTS`). Body `{ "collection": { "name": "..." } }`. Write API uses **`stores/v1`**, not `stores-reader`.
- **stores-catalog-v1 / Delete Collection** — [`deleteCollection`](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/catalog/delete-collection): `DELETE /stores/v1/collections/{id}` (same scope). Response body is an empty JSON object.
- **stores-provision-v3 / Get Catalog Version** — [`getCatalogVersion`](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-versioning/get-catalog-version): `GET /stores/v3/provision/version` (scope `STORES.CATALOG_READ_LIMITED`).
- **stores-catalog-v3 / Get Product** — [`getProduct` (Catalog V3)](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3/products-v3/get-product): `GET /stores/v3/products/{productId}`. Scopes: `STORES.PRODUCT_READ` (and `PRODUCT_READ_ADMIN` for non-visible products / merchant fields). Add a `fields` query in Bruno if you need specific projection.
- **site-media-v1 / Generate File Upload URL** — [`generateFileUploadUrl`](https://dev.wix.com/docs/api-reference/assets/media/media-manager/files/generate-file-upload-url): `POST /site-media/v1/files/generate-upload-url` (scope `SCOPE.DC-MEDIA.MANAGE-MEDIAMANAGER`). Body requires `mimeType`; optional `fileName`, `filePath`, `parentFolderId`, `private`, `labels`, `externalInfo`, `sizeInBytes`. Response includes `uploadUrl` for the client upload step (see Wix [Upload API](https://dev.wix.com/docs/rest/assets/media/media-manager/files/upload-api.md)).

Add more `.bru` files under new folders as you explore additional Wix APIs.

## Nest parity

When a call works here, port the same URL, query string, and headers into `WixApiService` (or a new method), reusing `resolvePrivateApiKey()` and **`WIX_SITE_ID`** from config so `wix-site-id` matches Bruno.
