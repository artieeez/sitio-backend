---
description: Add a Wix Stores REST call from pasted API docs to WixApiService, types, and Bruno
---

# Integrate a Wix API from a pasted definition (sitio-backend)

The user will paste a **Wix API definition** (REST tab from Wix dev docs, Bruno-style notes, or similar): method, full URL or path, request body shape, response shape, and permission scope.

**Goal:** implement the same in this repo: TypeScript types, `WixApiService` method, and **Bruno** requests under `bruno/wix-api/`, then update the Bruno README and root `readme.MD` Wix list.

## Before you edit

1. Read existing patterns in:
   - `src/modules/wix-integration/wix-api.service.ts` — `queryCollections`, `queryProducts`, `getProduct` (auth via `buildAuthHeaders`, `resolvePrivateApiKey`, `ServiceUnavailable` / `BadGateway` on failure).
   - `src/modules/wix-integration/wix-catalog.types.ts` — request/response DTOs.
2. If the Wix call is **read** under `stores-reader` → base `STORES_READER_BASE` = `https://www.wixapis.com/stores-reader/v1` (or match the spec).
3. If **write** under `stores/v1` (not reader) → `STORES_V1_BASE` = `https://www.wixapis.com/stores/v1`.

## Implementation checklist

1. **Types** (`wix-catalog.types.ts`): add `*Request` / `*Response` (and nested `query` types if WQL) as needed. Reuse `WixCatalogProduct` / `WixStoreCollection` when the response matches; extend with `?:` fields only when necessary.
2. **Service** (`wix-api.service.ts`): add an `async` method that:
   - Validates required ids/strings when the doc requires them.
   - Uses `this.wixIntegration.resolvePrivateApiKey()`; if missing, `throw new ServiceUnavailableException` with the same message style as other methods.
   - `fetch` with `POST` + `Content-Type: application/json` (or `GET`/`DELETE` as per spec) and `buildAuthHeaders(apiKey)`.
   - Parse JSON; on non-OK, `BadGatewayException` with status and truncated body; map `404` to `NotFoundException` only if the spec says the resource is missing.
   - Return a typed object; throw `BadGatewayException` if the body shape is invalid.
3. **JSDoc** on the new method: link to the official Wix doc URL from the spec (if the user provided it; otherwise Wix’s REST reference path).
4. **Bruno** (folder `bruno/wix-api/`):
   - Put the file under a sensible subfolder: e.g. `stores-catalog-v1/` for catalog reader v1, `stores-provision-v3/` for provision, etc. Match siblings.
   - Reuse `{{wixApiKey}}`, `{{wixSiteId}}`, and `{{wixStoresReaderBaseUrl}}` / `{{wixStoresV1BaseUrl}}` from `environments/Local.bru` when applicable.
   - If you need a new env var (e.g. a path param id, limit), add a safe default in `environments/Local.bru` and document it in `bruno/wix-api/README.md` in the table + **Requests** bullet.
   - Name requests clearly: e.g. `Query Products (minimal).bru` — include `meta` with `name`, `type: http`, `seq` (increment within that folder, avoid clashing with existing `seq` values in the same folder).
5. **Root `readme.MD`**: in the Wix/Bruno paragraph, add the new `WixApiService` method name to the backtick list (alphabetize or list in logical order).
6. **Do not** add secrets to committed files. Placeholders in `Local.bru` are fine.

## Optional

- If the new API should be exposed to the dashboard, add a `WixIntegrationController` route or another module; only do this if the spec or product clearly needs it. Default: **service + types + Bruno only**.

## When the spec is incomplete

- Ask one short follow-up: missing HTTP method, path, or whether the body is required.

Run `pnpm exec nest build` in `sitio-backend` when TypeScript changes are done.

**Context:** the user invoked this command and will paste the Wix API definition in the same chat (REST URL, method, body/response, scope). **Use the pasted text as the source of truth** for paths, method names, and field names.