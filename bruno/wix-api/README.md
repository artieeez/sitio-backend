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
| `wixSiteId` | Site GUID for requests that need the `wix-site-id` header (same as `WIX_SITE_ID` in the backend). Used only by **Get Product (with wix-site-id)**. |
| `productId` | Product GUID to fetch. |
| `wixStoresReaderBaseUrl` | Default `https://www.wixapis.com/stores-reader/v1` — change only if Wix updates the base path. |
| `wixStoresV3ProvisionBaseUrl` | Default `https://www.wixapis.com/stores/v3/provision` for **Get Catalog Version** (`GET .../version`). |

**Do not commit real secrets.** Prefer Bruno’s secret variables or keep keys only in your local Bruno app.

## Requests

- **Get Product** — `includeMerchantSpecificData=false`, no `wix-site-id` (matches the common Nest path when `WIX_SITE_ID` is unset).
- **Get Product (merchant data)** — `includeMerchantSpecificData=true` (needs extra permissions).
- **Get Product (with wix-site-id)** — same as Get Product but sends `wix-site-id` (matches Nest when `WIX_SITE_ID` is set).
- **stores-provision-v3 / Get Catalog Version** — [`getCatalogVersion`](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-versioning/get-catalog-version): `GET /stores/v3/provision/version` (scope `STORES.CATALOG_READ_LIMITED`). Optional **`Get Catalog Version (with wix-site-id)`** when the site header is required.

Add more `.bru` files under new folders as you explore additional Wix APIs.

## Nest parity

When a call works here, port the same URL, query string, and headers into `WixApiService` (or a new method), reusing `resolvePrivateApiKey()` and `WIX_SITE_ID` from config where applicable.
