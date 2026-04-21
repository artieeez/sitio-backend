---
name: wix-catalog-v1-filter-sort
description: Directs use of Wix Stores Catalog v1 filter, sort, and pagination rules when building REST query bodies (e.g. queryCollections, query products). Use when implementing or debugging Wix catalog v1 endpoints, WQL filter strings, sort strings, paging, or Bruno/Nest requests under stores-reader or stores v1 query APIs.
---

# Wix Catalog v1 — filter, sort, pagination

## When this applies

Any time you build or review a **Catalog v1** query that includes **`filter`**, **`sort`**, or **paging** (offset/limit, cursor, or continuation patterns) against Wix Stores REST APIs (e.g. `POST .../collections/query`, `POST .../products/query`).

## Required reference

**Always open and follow:**

[Filter and sort (Catalog v1)](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/catalog/filter-and-sort.md)

That page lists **which fields support filtering** (and allowed operators) for **Query Products** vs **Query Collections**, whether **sorting** is allowed per field, and **example curl bodies** (string-encoded JSON for `filter`, sort arrays as strings, etc.).

Broader query-language rules: [Wix API Query Language](https://dev.wix.com/api/rest/getting-started/api-query-language) (linked from the article above).

**Free-text search** (WQL **`search`**, not **`filter`**) — see [About the Wix API Query Language](https://dev.wix.com/docs/api-reference/articles/work-with-wix-apis/data-retrieval/about-the-wix-api-query-language.md) and the repo skill **`wix-api-query-language-search`**.

## Implementation reminders

- REST bodies typically pass **`filter` and `sort` as strings** containing JSON (see examples on the doc page), not always as raw objects—match the endpoint’s schema and working Bruno examples in this repo.
- **Collections** allow filtering on `name` and `id` only (per the doc table); **products** expose many more fields (e.g. `collections.id`, `price`, `slug`).
- Prefer copying **proven curl shapes** from the doc when unsure, then align Nest `JSON.stringify` / Bruno `body:json` with the same structure.
