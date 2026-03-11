# Phase 2b (V2 Upgrade) — Implementation Plan

## Goal

Upgrade all 6 existing v1 entries to v2 by adding filtering, search, and the author-books relationship. After this phase, every entry implements 6 endpoints and passes the v2 validator.

## Prerequisites

- [x] Phase A complete (spec, validator, seeds, templates)
- [x] Phase B complete (6 v1 entries created and passing v1 validation)
- [x] Validator supports `--level v2` and `--detect`

## What v2 Adds to v1

Four new capabilities on top of the existing 4 GET endpoints:

### 1. Keyword filtering on GET /api/authors

`GET /api/authors?keyword=X` — case-insensitive substring match on `name` and `bio` fields.

- Without `keyword` param: returns all authors (unchanged from v1)
- Non-matching keyword: returns `200` with empty array (not 404)
- `id` is never searched

### 2. Keyword filtering on GET /api/books

`GET /api/books?keyword=X` — case-insensitive substring match on `title`, `genre`, and `description` fields.

- Without `keyword` param: returns all books as flat array (unchanged from v1)
- Non-matching keyword: returns `200` with empty array
- `year` and `id` are never searched

### 3. Author's books endpoint

`GET /api/authors/{id}/books` — returns all books by a specific author.

- If author exists but has no books: return `200` with empty array
- If author does not exist: return `404` with `{"error": "Author not found"}`

### 4. Combined search endpoint

`GET /api/search?keyword=X` — searches both authors and books, returns an object with two arrays.

- Authors searched on `name`, `bio`
- Books searched on `title`, `genre`, `description`
- `keyword` parameter is **required** — if missing, return `400` with `{"error": "keyword parameter is required"}`

**Response shape:**
```json
{
  "authors": [...],
  "books": [...]
}
```

## Entries to Upgrade

| # | Entry | Language | Framework | Key Implementation Notes |
|---|-------|----------|-----------|--------------------------|
| 1 | api-go-fiber | Go | Fiber v2 | `c.Query("keyword")`, SQL LIKE with `%keyword%`, `LOWER()` |
| 2 | api-js-node_express | JavaScript | Express 4 | `req.query.keyword`, better-sqlite3 `.all()` with params |
| 3 | api-python-flask | Python | Flask 3 | `request.args.get("keyword")`, sqlite3 `LIKE` |
| 4 | api-python-fastapi | Python | FastAPI | `keyword: Optional[str] = None` query param |
| 5 | api-rust-actix | Rust | Actix Web 4 | `web::Query<>` extractor, rusqlite params |
| 6 | api-ts-bun_elysia | TypeScript | Elysia | `query.keyword`, bun:sqlite `.all()` with params |

## SQL Pattern for Filtering

All entries use the same SQL approach:

**Authors filter:**
```sql
SELECT id, name, bio FROM authors
WHERE LOWER(name) LIKE '%' || LOWER(?) || '%'
   OR LOWER(bio) LIKE '%' || LOWER(?) || '%'
```

**Books filter:**
```sql
SELECT id, title, author_id AS authorId, genre, year, description FROM books
WHERE LOWER(title) LIKE '%' || LOWER(?) || '%'
   OR LOWER(genre) LIKE '%' || LOWER(?) || '%'
   OR LOWER(description) LIKE '%' || LOWER(?) || '%'
```

**Author's books:**
```sql
-- First check author exists:
SELECT id FROM authors WHERE id = ?
-- Then get books:
SELECT id, title, author_id AS authorId, genre, year, description FROM books WHERE author_id = ?
```

## Per-Entry Changes

For each entry:

1. **Modify the GET /api/authors handler** — check for `keyword` query param, if present add `WHERE LOWER(name) LIKE ... OR LOWER(bio) LIKE ...`
2. **Modify the GET /api/books handler** — check for `keyword` query param, if present add `WHERE LOWER(title) LIKE ... OR LOWER(genre) LIKE ... OR LOWER(description) LIKE ...`
3. **Add GET /api/authors/{id}/books handler** — check author exists (404 if not), then query books by `author_id`
4. **Add GET /api/search handler** — require `keyword` param (400 if missing), run both author and book filter queries, return `{authors: [...], books: [...]}`
5. **Update entry.yaml** — change `level: "v1"` to `level: "v2"`
6. **Update README.md** — update level reference

## Execution Order

All 6 entries are independent — they can be upgraded in parallel. After all upgrades:
- Docker build + validate each entry with `--detect` (expect v2 detected)

```
[Upgrade 1: go-fiber]      ──┐
[Upgrade 2: js-node_express] ┤
[Upgrade 3: python-flask]    ┼──→ [Docker build + validate all]
[Upgrade 4: python-fastapi]  ┤
[Upgrade 5: rust-actix]      ┤
[Upgrade 6: ts-bun_elysia]  ──┘
```

## Validator Expectations (v2)

The validator runs these additional tests at v2:

- `GET /api/authors?keyword=butler` → 1 result (Octavia Butler)
- `GET /api/authors?keyword=hugo` → N.K. Jemisin (bio match)
- `GET /api/authors?keyword=BUTLER` → case insensitive
- `GET /api/books?keyword=fantasy` → 4 results (genre match)
- `GET /api/books?keyword=tortoise` → 1 result (Small Gods description)
- `GET /api/books?keyword=1987` → 0 results (year NOT searched)
- Non-matching filter → 200 with empty array
- `GET /api/search?keyword=science fiction` → both authors and books
- `GET /api/search` (no keyword) → 400
- `GET /api/authors/1/books` → 2 books (Kindred, Parable of the Sower)
- `GET /api/authors/9999/books` → 404

## Success Criteria

1. All 6 entry.yaml files updated to `level: "v2"`
2. Each entry implements all 4 new capabilities
3. `./validate/run.sh http://localhost:8080 --level v2` passes for each entry
4. `--detect` identifies each entry as v2
