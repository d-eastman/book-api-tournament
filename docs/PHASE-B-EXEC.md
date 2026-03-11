# Phase B (Phase 2a: V1 Entry Batch) — Execution Summary

## Status: COMPLETE

All 5 new entries created with complete file sets. Combined with the existing api-go-fiber from Phase A, the project now has 6 v1 entries spanning 5 languages and 4 runtimes.

---

## Entries Created

| Entry | Language | Framework | Runtime | Files | Key Pattern |
|-------|----------|-----------|---------|-------|-------------|
| api-js-node_express | JavaScript | Express 4 | Node.js | 6 | better-sqlite3, SQL alias `AS authorId` |
| api-python-flask | Python | Flask 3 | CPython | 6 | sqlite3.Row, manual key rename |
| api-python-fastapi | Python | FastAPI | CPython + Uvicorn | 6 | sqlite3.Row, dict comprehension rename, JSONResponse for 404 |
| api-rust-actix | Rust | Actix Web 4 | Native | 7 | rusqlite (bundled), serde `#[serde(rename)]`, Mutex<Connection> |
| api-ts-bun_elysia | TypeScript | Elysia 1.1 | Bun | 6 | bun:sqlite built-in, SQL alias `AS authorId` |

**Previously existing:** api-go-fiber (Go, Fiber v2, Node — from Phase A)

**Total entries: 6**

---

## What Each Entry Contains

Every entry follows the same structure:

```
entries/api-{lang}-{framework}/
├── [source file(s)]     # Main application implementing 4 GET endpoints
├── [dependency file]    # package.json / requirements.txt / Cargo.toml / go.mod
├── Dockerfile           # Multi-stage build, SQLite init, port 8080
├── entry.yaml           # level: v1 metadata
├── README.md            # Brief description
└── db/
    ├── schema.sql       # Copied from repo root
    └── seed-small.sql   # Copied from repo root
```

---

## Implementation Approaches

### author_id → authorId Mapping

Three different patterns emerged across languages:

1. **SQL alias** (Node/Express, Bun/Elysia): `SELECT author_id AS authorId` — cleanest, handled at query level
2. **Manual key rename** (Flask, FastAPI): Query returns `author_id`, Python code renames to `authorId` in dict
3. **Serde annotation** (Rust): `#[serde(rename = "authorId")]` on the struct field — compile-time mapping

### SQLite Access

| Entry | SQLite Library | Sync/Async |
|-------|---------------|------------|
| Node/Express | better-sqlite3 | Sync |
| Python/Flask | sqlite3 (stdlib) | Sync |
| Python/FastAPI | sqlite3 (stdlib) | Sync (in async framework) |
| Rust/Actix | rusqlite (bundled) | Sync (behind Mutex) |
| Bun/Elysia | bun:sqlite (built-in) | Sync |
| Go/Fiber | go-sqlite3 (CGO) | Sync |

### Error Handling

All entries return `{"error": "Author not found"}` or `{"error": "Book not found"}` with HTTP 404. FastAPI notably avoids its default `HTTPException` (which would return `{"detail": "..."}` instead of the required `{"error": "..."}` shape) by using `JSONResponse` directly.

---

## Dockerfile Consistency

All 6 entries follow the same pattern:
1. Install dependencies / build
2. `apt-get install -y sqlite3` (where needed)
3. `COPY db/schema.sql db/seed-small.sql /app/db/`
4. `cat /app/db/schema.sql /app/db/seed-small.sql | sqlite3 /app/books.db`
5. `ENV DB_PATH=/app/books.db`
6. `EXPOSE 8080`

---

## File Count

| Entry | New Files |
|-------|-----------|
| api-js-node_express | 6 (app.js, package.json, Dockerfile, entry.yaml, README.md, db/) |
| api-python-flask | 6 (app.py, requirements.txt, Dockerfile, entry.yaml, README.md, db/) |
| api-python-fastapi | 6 (app.py, requirements.txt, Dockerfile, entry.yaml, README.md, db/) |
| api-rust-actix | 7 (src/main.rs, Cargo.toml, Dockerfile, entry.yaml, README.md, db/) |
| api-ts-bun_elysia | 6 (src/index.ts, package.json, Dockerfile, entry.yaml, README.md, db/) |
| **Total** | **31 new files** |

---

## Validation

All entries are designed to pass `./validate/run.sh http://localhost:8080 --level v1` when built and run via Docker. Each implements:

- `GET /api/authors` — returns JSON array of all 8 authors
- `GET /api/authors/{id}` — returns single author or 404
- `GET /api/books` — returns JSON array of all 16 books with `authorId` (camelCase)
- `GET /api/books/{id}` — returns single book or 404
- Content-Type: `application/json`
- Error shape: `{"error": "message"}`

Docker builds and validation runs are pending (require Docker runtime).

---

## Next Steps

- **Docker validation**: Build and run each entry, validate with `./validate/run.sh --level v1`
- **Phase C (V2 Upgrade)**: Add filtering, search, and author-books relationship endpoints to entries
- **More entries**: Add entries for remaining languages (C#, Java, Kotlin, Ruby, PHP, etc.)
