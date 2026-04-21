---
name: wix-api-query-language-search
description: Points to Wix API Query Language docs for free-text search (the query object’s search section, not filter). Use when implementing or debugging Wix endpoints that support search-style matching, WQL search objects, expression/mode/fuzzy, or when the user asks for full-text or “search” behavior distinct from structured filters.
---

# Wix API Query Language — free-text search

## When this applies

Whenever the goal is **free-text search** across searchable fields (WQL **`search`** on the query object), **not** structured field matching (**`filter`**).

## Required reference

**Always open and follow:**

[About the Wix API Query Language](https://dev.wix.com/docs/api-reference/articles/work-with-wix-apis/data-retrieval/about-the-wix-api-query-language.md)

That article covers the full query shape (`filter`, `sort`, `paging`, `fields`, etc.). For **search**, use the **`search`** section (search object only in APIs that support it): `expression`, `mode` (`AND` / `OR`), optional `fields`, optional `fuzzy`, as described there.

## Filter vs search

| Mechanism | Role |
|-----------|------|
| **`filter`** | Structured conditions (equality, operators, ranges) on fields the API allows. |
| **`search`** | Free-text matching in **searchable** fields; not a substitute for `filter`. |

Do **not** implement “search the user typed into a box” by only adding `filter` clauses unless the API and product intent are **field-only** queries. If the API supports **`search`**, align with that doc.

## Related repo skill

Structured **Stores Catalog v1** field filters / sort / paging (often string-encoded in REST) are covered in **`wix-catalog-v1-filter-sort`** — use that for catalog **filter** strings, and this skill when the requirement is **free-text search** per WQL.
