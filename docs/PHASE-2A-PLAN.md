# Phase B (Phase 2a: V1 Entry Batch) — Implementation Plan

## Goal

Create a diverse batch of v1 entries across multiple languages and runtimes, proving the tournament format works across ecosystems. Each entry implements the same 4 GET endpoints against SQLite, follows the Dockerfile pattern from Phase A, and is structured for future v2/v3 upgrades.

## Prerequisites

- [x] Phase A complete (spec, validator, schema, seeds, entry templates, api-go-fiber proven)
- [x] Validator working with `--level v1` and `--detect`
- [x] db/schema.sql and db/seed-small.sql ready to copy into entries

## Entries to Create

| # | Entry | Language | Framework | Runtime | Why |
|---|-------|----------|-----------|---------|-----|
| 1 | api-js-node_express | JavaScript | Express 4 | Node.js | Most popular Node framework, baseline for JS ecosystem |
| 2 | api-python-flask | Python | Flask 3 | CPython | Classic Python web framework, widely known |
| 3 | api-python-fastapi | Python | FastAPI | CPython + Uvicorn | Modern async Python, popular for APIs |
| 4 | api-rust-actix | Rust | Actix Web 4 | Native | High-performance systems language entry |
| 5 | api-ts-bun_elysia | TypeScript | Elysia | Bun | Modern JS runtime alternative to Node |

**Total after Phase B: 6 entries** (5 new + 1 existing api-go-fiber)

## Per-Entry Deliverables

Each entry directory (`entries/api-{lang}-{framework}/`) contains:

| File | Purpose |
|------|---------|
| Source code | Main application file(s) implementing 4 GET endpoints |
| Dependency file | go.mod, package.json, requirements.txt, Cargo.toml, etc. |
| Dockerfile | Multi-stage build, copies db files, initializes SQLite, runs on :8080 |
| entry.yaml | Metadata: framework, language, version, level: v1 |
| README.md | Brief implementation description |
| db/schema.sql | Copied from repo root |
| db/seed-small.sql | Copied from repo root |

## Implementation Pattern (All Entries)

Every entry follows the same logical structure:

### Endpoints
1. `GET /api/authors` — Query all authors from SQLite, return JSON array
2. `GET /api/authors/:id` — Query single author, return 404 if not found
3. `GET /api/books` — Query all books from SQLite, return JSON array (with `authorId` camelCase)
4. `GET /api/books/:id` — Query single book, return 404 if not found

### Requirements
- Read `DB_PATH` env var (default: `/app/books.db`)
- Map `author_id` SQL column → `authorId` JSON key
- Return `{"error": "..."}` on 404
- Content-Type: `application/json`
- Listen on port 8080

### Dockerfile Pattern
```
1. Build stage: compile/install dependencies
2. Runtime stage: debian-slim or alpine
3. Install sqlite3 (if needed)
4. Copy db/schema.sql + db/seed-small.sql
5. Initialize books.db: cat schema.sql seed-small.sql | sqlite3 books.db
6. Copy built artifact
7. ENV DB_PATH=/app/books.db
8. EXPOSE 8080
9. CMD [run command]
```

## Detailed Steps per Entry

### Entry 1: api-js-node_express

- **Source**: `app.js` (~60 lines)
- **Dependencies**: express, better-sqlite3
- **Dockerfile**: FROM node:20-slim → install, FROM node:20-slim → copy + run
- **Notes**: better-sqlite3 is synchronous, no async complexity. Express is the baseline Node framework.

### Entry 2: api-python-flask

- **Source**: `app.py` (~60 lines)
- **Dependencies**: flask (requirements.txt)
- **Dockerfile**: FROM python:3.12-slim → pip install → run with flask
- **Notes**: Python's sqlite3 module is built-in. Flask is the classic choice.

### Entry 3: api-python-fastapi

- **Source**: `app.py` (~70 lines)
- **Dependencies**: fastapi, uvicorn (requirements.txt)
- **Dockerfile**: FROM python:3.12-slim → pip install → run with uvicorn
- **Notes**: FastAPI uses Pydantic models. sqlite3 is built-in. Async framework but sqlite3 is sync (acceptable for v1).

### Entry 4: api-rust-actix

- **Source**: `src/main.rs` (~120 lines)
- **Dependencies**: actix-web, rusqlite, serde, serde_json (Cargo.toml)
- **Dockerfile**: FROM rust:1.77-slim → cargo build --release → debian-slim runtime
- **Notes**: Rusqlite for SQLite. Serde for JSON serialization. Actix is the top Rust web framework.

### Entry 5: api-ts-bun_elysia

- **Source**: `src/index.ts` (~60 lines)
- **Dependencies**: elysia, bun:sqlite (built-in)
- **Dockerfile**: FROM oven/bun:1 → install → run
- **Notes**: Bun has built-in SQLite support. Elysia is the idiomatic Bun framework.

## Execution Order

All 5 entries are independent — they can be built in parallel. For each entry:

1. Create directory structure
2. Write source code
3. Write Dockerfile
4. Write entry.yaml + README.md
5. Copy db/schema.sql and db/seed-small.sql

After all entries are written:
6. Docker build + validate each entry (where Docker is available)

```
[Entry 1: js-node_express] ──┐
[Entry 2: python-flask]  ──┤
[Entry 3: python-fastapi] ─┼──→ [Docker build + validate all]
[Entry 4: rust-actix]    ──┤
[Entry 5: ts-bun_elysia]  ──┘
```

## Success Criteria

1. All 5 entry directories created with complete file sets
2. Each Dockerfile follows the standard pattern (multi-stage, SQLite init)
3. Each entry.yaml has `level: v1`
4. Source code maps `author_id` → `authorId` in JSON responses
5. Error responses use `{"error": "message"}` shape
6. Docker build succeeds for each entry (if Docker available)
7. `./validate/run.sh http://localhost:8080 --level v1` passes for each entry (if Docker available)
