# Phase 2b (V2 Upgrade) — Execution Summary

## Status: COMPLETE

All 6 entries upgraded from v1 to v2. Each now implements 6 endpoints with filtering, search, and author-books relationship.

---

## Entries Upgraded

| Entry | Language | Framework | Source File(s) |
|-------|----------|-----------|----------------|
| api-go-fiber | Go | Fiber v2 | main.go |
| api-js-node_express | JavaScript | Express 4 | app.js |
| api-python-flask | Python | Flask 3 | app.py |
| api-python-fastapi | Python | FastAPI | app.py |
| api-rust-actix | Rust | Actix Web 4 | src/main.rs |
| api-ts-bun_elysia | TypeScript | Elysia 1.1 | src/index.ts |

---

## What Was Added to Each Entry

### 1. Keyword filtering on GET /api/authors

All entries now accept an optional `keyword` query parameter. When present, authors are filtered by case-insensitive substring match on `name` and `bio` fields using SQL `LOWER()` + `LIKE`. Without keyword, all authors are returned (unchanged from v1). Non-matching keywords return 200 with an empty array.

### 2. Keyword filtering on GET /api/books

Same pattern as authors. Filters on `title`, `genre`, and `description`. The `year` and `id` fields are never searched. Returns flat array in all cases (no pagination at v2).

### 3. GET /api/authors/{id}/books

New endpoint returning books by a specific author. Checks author existence first — returns 404 with `{"error": "Author not found"}` if the author doesn't exist. Returns 200 with empty array if the author exists but has no books. All book results include `authorId` (camelCase).

### 4. GET /api/search?keyword=X

New combined search endpoint. The `keyword` parameter is required — returns 400 with `{"error": "keyword parameter is required"}` if missing. Searches authors on `name`/`bio` and books on `title`/`genre`/`description`. Returns `{"authors": [...], "books": [...]}`.

---

## Implementation Patterns by Language

### SQL Filtering (all entries use the same pattern)

```sql
-- Authors:
WHERE LOWER(name) LIKE '%' || LOWER(?) || '%'
   OR LOWER(bio) LIKE '%' || LOWER(?) || '%'

-- Books:
WHERE LOWER(title) LIKE '%' || LOWER(?) || '%'
   OR LOWER(genre) LIKE '%' || LOWER(?) || '%'
   OR LOWER(description) LIKE '%' || LOWER(?) || '%'
```

### Query Parameter Access

| Entry | How keyword is read |
|-------|-------------------|
| Go/Fiber | `c.Query("keyword")` |
| JS/Express | `req.query.keyword` |
| Python/Flask | `request.args.get("keyword")` |
| Python/FastAPI | `keyword: str = None` function param |
| Rust/Actix | `web::Query<KeywordQuery>` with `#[derive(Deserialize)]` struct |
| TS/Elysia | `query.keyword` from handler context |

### Route Registration Order

Entries with path-parameter conflicts (e.g., `/api/authors/:id` vs `/api/authors/:id/books`) register the more specific `/books` route first to ensure correct matching. This applies to Go/Fiber and Rust/Actix. Express and Elysia handle this correctly regardless of order since `/books` is a literal suffix.

---

## Changes Per Entry

| Entry | entry.yaml | Source | New Routes | New Structs/Imports |
|-------|-----------|--------|------------|---------------------|
| api-go-fiber | v1→v2 | Modified getAuthors, getBooks; added getAuthorBooks, search | 2 | — |
| api-js-node_express | v1→v2 | Modified /authors, /books; added /authors/:id/books, /search | 2 | — |
| api-python-flask | v1→v2 | Modified get_authors, get_books; added get_author_books, search | 2 | Added `request` import |
| api-python-fastapi | v1→v2 | Modified get_authors, get_books; added get_author_books, search | 2 | — |
| api-rust-actix | v1→v2 | Modified get_authors, get_books; added get_author_books, search | 2 | KeywordQuery, SearchResult structs; added Deserialize import |
| api-ts-bun_elysia | v1→v2 | Modified /authors, /books; added /authors/:id/books, /search | 2 | — |

---

## Validation

All entries are designed to pass `./validate/run.sh http://localhost:8080 --level v2` when built and run via Docker. The v2 validator tests:

- `keyword=butler` on authors → 1 result (Octavia Butler)
- `keyword=hugo` on authors → N.K. Jemisin (bio match)
- `keyword=BUTLER` → case insensitive
- `keyword=fantasy` on books → 4 results (genre match)
- `keyword=tortoise` on books → 1 result (Small Gods description)
- `keyword=1987` on books → 0 results (year NOT searched)
- Non-matching filter → 200 with empty array
- `search?keyword=science fiction` → both authors and books
- `search` (no keyword) → 400
- `authors/1/books` → 2 books (Kindred, Parable of the Sower)
- `authors/9999/books` → 404

Docker builds and validation runs are pending (require Docker runtime).

---

## Next Steps

- **Docker validation**: Build and run each entry, validate with `./build-and-validate.sh`
- **Phase 2c (V3 Upgrade)**: Add POST /api/books, GET /api/stats, and pagination on GET /api/books
