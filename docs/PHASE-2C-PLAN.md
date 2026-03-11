# Phase 2c (V3 Upgrade) — Implementation Plan

## Goal

Upgrade all 6 v2 entries to v3 (full contract) by adding pagination on GET /api/books, POST /api/books with validation, and GET /api/stats with aggregate computation. After this phase, every entry implements 8 endpoints and passes the v3 validator.

## Prerequisites

- [x] Phase A complete (spec, validator, seeds, templates)
- [x] Phase B complete (6 entries created)
- [x] Phase 2b complete (all 6 entries at v2 with filtering, search, author-books)
- [x] Validator supports `--level v3` and `--detect`

## What v3 Adds to v2

Three new capabilities:

### 1. Pagination on GET /api/books (without keyword)

`GET /api/books` **without** a `keyword` parameter now returns a paginated wrapper instead of a flat array.

**Query params:** `page` (default: 1), `limit` (default: 20)

**Response shape:**
```json
{
  "data": [...],
  "page": 1,
  "limit": 20,
  "totalItems": 16,
  "totalPages": 1
}
```

**Rules:**
- `totalPages = ceil(totalItems / limit)`
- Beyond last page: return 200 with empty `data` array, fields still populated correctly
- `GET /api/books?keyword=X` still returns a **flat array** (no pagination wrapper), unchanged from v2

### 2. POST /api/books

Creates a new book. All five fields are required.

**Request body:**
```json
{
  "title": "New Book",
  "authorId": 1,
  "genre": "Fantasy",
  "year": 2024,
  "description": "A new book."
}
```

**Validation rules:**
- All fields must be present and non-empty
- `authorId` must reference an existing author (check DB)
- `year` must be an integer between 1000 and 9999 (inclusive)

**Success:** `201 Created` with the created book including server-generated `id`
**Validation failure:** `400 Bad Request` with `{"error": "descriptive message"}`

### 3. GET /api/stats

Returns aggregate statistics computed from current data.

**Response:**
```json
{
  "totalAuthors": 8,
  "totalBooks": 16,
  "earliestYear": 1953,
  "latestYear": 2020,
  "averageYear": 1987.25,
  "booksByGenre": {"Fantasy": 4, "Literary Fiction": 6, ...},
  "authorsByBookCount": {"Octavia Butler": 2, ...}
}
```

**Key details:**
- `averageYear` rounded to 2 decimal places
- `booksByGenre`: map of genre → count
- `authorsByBookCount`: map of author name → book count

## Breaking Changes from v2

### Database must be read-write

POST /api/books writes to the database. Entries that currently open the database as readonly must change:

| Entry | Current | Change Needed |
|-------|---------|---------------|
| api-js-node_express | `{ readonly: true }` | Remove readonly option |
| api-ts-bun_elysia | `{ readonly: true }` | Remove readonly option |
| api-go-fiber | Read-write | None |
| api-python-flask | Read-write per request | None |
| api-python-fastapi | Read-write per request | None |
| api-rust-actix | Read-write | None |

### JSON body parsing

POST requires parsing a JSON request body. Most frameworks need middleware or configuration:

| Entry | JSON Parsing |
|-------|-------------|
| Go/Fiber | `c.BodyParser(&book)` (built-in) |
| JS/Express | `app.use(express.json())` middleware |
| Python/Flask | `request.get_json()` |
| Python/FastAPI | Pydantic model or `request.json()` |
| Rust/Actix | `web::Json<NewBook>` extractor |
| TS/Elysia | `body` from handler context |

## SQL Queries for v3

### Pagination
```sql
-- Count total
SELECT COUNT(*) FROM books
-- Fetch page
SELECT id, title, author_id, genre, year, description FROM books ORDER BY id LIMIT ? OFFSET ?
-- offset = (page - 1) * limit
```

### POST validation
```sql
-- Check author exists
SELECT id FROM authors WHERE id = ?
-- Insert book
INSERT INTO books (title, author_id, genre, year, description) VALUES (?, ?, ?, ?, ?)
-- Get last inserted ID (language-specific: last_insert_rowid(), lastInsertRowid, etc.)
```

### Stats
```sql
SELECT COUNT(*) FROM authors                               -- totalAuthors
SELECT COUNT(*) FROM books                                 -- totalBooks
SELECT MIN(year) FROM books                                -- earliestYear
SELECT MAX(year) FROM books                                -- latestYear
SELECT AVG(year) FROM books                                -- averageYear (round to 2 dp)
SELECT genre, COUNT(*) FROM books GROUP BY genre           -- booksByGenre
SELECT a.name, COUNT(b.id) FROM authors a
  JOIN books b ON a.id = b.author_id
  GROUP BY a.id, a.name                                    -- authorsByBookCount
```

## Entries to Upgrade

| # | Entry | Language | Key v3 Notes |
|---|-------|----------|-------------|
| 1 | api-go-fiber | Go | `c.BodyParser()`, `math.Round()` for averageYear, `result.LastInsertId()` |
| 2 | api-js-node_express | JavaScript | `express.json()` middleware, remove readonly, `db.prepare().run()`, `info.lastInsertRowid` |
| 3 | api-python-flask | Python | `request.get_json()`, `cursor.lastrowid`, `round(avg, 2)` |
| 4 | api-python-fastapi | Python | `await request.json()` or Pydantic, `cursor.lastrowid`, `round(avg, 2)` |
| 5 | api-rust-actix | Rust | `web::Json<NewBook>`, `conn.last_insert_rowid()`, f64 rounding |
| 6 | api-ts-bun_elysia | TypeScript | `body` context, remove readonly, `db.run()`, `Math.round()` |

## Per-Entry Changes

For each entry:

1. **Remove readonly** (JS/Express and TS/Elysia only)
2. **Add JSON body parsing** (Express needs `app.use(express.json())`)
3. **Modify GET /api/books** — when no keyword: return paginated wrapper with `page`, `limit`, `totalItems`, `totalPages`, `data`. When keyword present: keep flat array (unchanged).
4. **Add POST /api/books** — parse body, validate all 5 fields, check authorId exists, check year range, insert, return 201 with created book.
5. **Add GET /api/stats** — run aggregate queries, return stats object with all 7 fields.
6. **Update entry.yaml** — change `level: "v2"` to `level: "v3"`

## Execution Order

All 6 entries are independent — upgrade in parallel. After all upgrades:
- Docker build + validate each entry with `--detect` (expect v3 detected)

```
[Upgrade 1: go-fiber]      ──┐
[Upgrade 2: js-node_express] ┤
[Upgrade 3: python-flask]    ┼──→ [Docker build + validate all]
[Upgrade 4: python-fastapi]  ┤
[Upgrade 5: rust-actix]      ┤
[Upgrade 6: ts-bun_elysia]  ──┘
```

## Validator Expectations (v3)

The v3 validator runs these additional tests on top of v2:

**Pagination:**
- `GET /api/books` returns paginated wrapper with data, page, limit, totalItems, totalPages
- Default page=1, limit=20
- `GET /api/books?limit=5` → 5 items in data
- `GET /api/books?limit=5&page=2` → page=2
- `GET /api/books?page=9999` → empty data array
- totalPages consistent with ceil(totalItems/limit)
- `GET /api/books?keyword=fantasy` → flat array (NOT paginated)

**Write:**
- POST with valid data → 201, has id, correct title
- Created book persists (GET by id works)
- POST with missing title → 400
- POST with invalid authorId → 400
- POST with year < 1000 → 400

**Stats:**
- totalAuthors = 8
- totalBooks = 16 (or 17 if POST ran first)
- earliestYear = 1953
- latestYear = 2020 (or 2024 if POST ran)
- averageYear ≈ 1987.25
- booksByGenre is object with Fantasy >= 4, Literary Fiction >= 6
- authorsByBookCount is object with Octavia Butler >= 2

## Success Criteria

1. All 6 entry.yaml files updated to `level: "v3"`
2. Each entry implements pagination, POST, and stats
3. `./validate/run.sh http://localhost:8080 --level v3` passes for each entry
4. `--detect` identifies each entry as v3
