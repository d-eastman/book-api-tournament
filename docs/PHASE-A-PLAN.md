# Phase A (Phase 1: Foundation) — Implementation Plan

## Goal

Build all foundational infrastructure so that entries can be created, validated, and eventually benchmarked. After this phase, the project has a complete spec, working database seeds, a multi-level validator, CI pipeline, and one working v1 entry proving the pipeline end-to-end.

## Prerequisites

- [x] CLAUDE.md written
- [x] control-center/CONTROL-CENTER.md written
- [x] Git repo initialized

## Deliverables

| # | Deliverable | Files Created |
|---|-------------|---------------|
| 1 | Repository scaffolding | README.md, CONTRIBUTING.md, LICENSE, hall-of-fame.md, .gitignore |
| 2 | GitHub config | .github/CODEOWNERS, .github/PULL_REQUEST_TEMPLATE.md, .github/workflows/validate-entry.yml |
| 3 | API Specification | spec/SPEC.md, spec/CHANGELOG.md |
| 4 | Database schema & seeds | db/schema.sql, db/seed-small.sql, db/seed-medium.sql, db/seed-large.sql, db/generate-seeds.py |
| 5 | Validator | validate/run.sh, validate/validator.py |
| 6 | Entry templates | entries/Dockerfile.example, entries/entry.yaml.example |
| 7 | First v1 entry | entries/api-go-fiber/ (Dockerfile, entry.yaml, README.md, main.go, go.mod, go.sum, db/) |

## Detailed Steps

### Step 1: Repository Scaffolding

**README.md** — Project overview, quick start, links to SPEC.md and CONTRIBUTING.md. Keep it concise — this is a technical project, not a marketing page.

**CONTRIBUTING.md** — Step-by-step guide for external contributors: fork, create entry, validate, PR. Reference the entry requirements from CLAUDE.md.

**LICENSE** — MIT license.

**hall-of-fame.md** — Empty template with headers for accepted entries.

**.gitignore** — Standard ignores: OS files, IDE files, build artifacts, node_modules, *.db, __pycache__, etc.

### Step 2: GitHub Configuration

**.github/CODEOWNERS** — Maintainer owns all files. This enables required reviews on protected branches.

**.github/PULL_REQUEST_TEMPLATE.md** — Checklist: entry.yaml present, Dockerfile builds, validator passes, no files modified outside entries/.

**.github/workflows/validate-entry.yml** — CI workflow triggered on PRs:
1. Check that PR only modifies files under `entries/`
2. Detect which entry directory was changed
3. Build the entry's Docker image
4. Start the container on port 8080
5. Run `validate/run.sh` against it with `--detect`
6. Report results

### Step 3: API Specification (spec/SPEC.md)

Write the full API contract as a standalone document. This is the **single source of truth** that all entries implement against. Structure:

1. **Overview** — What this API does, base URL, content type
2. **Data Model** — Author and Book schemas with JSON field names
3. **Endpoints by Level** — Each endpoint with method, path, query params, request/response bodies, status codes, edge cases
4. **Error Handling** — Standard error shape, when to return 400 vs 404
5. **Filtering Rules** — Case-insensitive substring, which fields, year exclusion
6. **Pagination** — v3 only, wrapper shape, defaults
7. **Database** — SQLite setup, DB_PATH env var, schema reference

**spec/CHANGELOG.md** — Initial entry: "v1.0.0 — Initial specification"

### Step 4: Database Schema & Seeds

**db/schema.sql** — Two tables: `authors` (id, name, bio) and `books` (id, title, author_id, genre, year, description).

**db/seed-small.sql** — 8 authors, 16 books as defined in CLAUDE.md. INSERT statements.

**db/generate-seeds.py** — Python script using `random.Random(42)` for deterministic generation:
- Medium: 100 authors, 1,000 books
- Large: 500 authors, 50,000 books
- Generates realistic author names, bios, book titles, genres, years, descriptions
- Outputs `seed-medium.sql` and `seed-large.sql`

Run the generator to produce seed-medium.sql and seed-large.sql.

### Step 5: Validator

**validate/run.sh** — Shell wrapper that:
- Accepts URL as first arg
- Passes remaining args to validator.py
- Requires Python 3.6+ (no pip dependencies)

**validate/validator.py** — Zero-dependency Python script implementing:

1. **CLI args**: `--level hardcoded|v1|v2|v3` (default v3), `--detect`, `--verbose`
2. **Phase 1 — Smoke Test**: Hit `/api/authors`, check 200 + JSON content-type
3. **Phase 2 — Read Correctness**: Validate all authors, books, individual lookups, camelCase keys
4. **Phase 3 — Filter Correctness** (v2+): Keyword filtering on authors/books, case insensitivity, year not searched
5. **Phase 4 — Search Correctness** (v2+): Combined search endpoint, 400 for missing keyword
6. **Phase 5 — Relationship** (v2+): Author's books, 404 for missing author
7. **Phase 6 — Write Correctness** (v3): POST /api/books, validation errors, 201 on success
8. **Phase 7 — Compute/Stats** (v3): All stats fields with correct values
9. **Phase 8 — Error Handling**: 404 for missing resources, error JSON shape
10. **Phase 9 — Pagination** (v3): Default pagination, custom page/limit, edge cases

**Auto-detect mode** (`--detect`): Run each level in order, stop at first failure, report detected level and remaining failures.

### Step 6: Entry Templates

**entries/Dockerfile.example** — Annotated Dockerfile template showing the two-stage build pattern with SQLite setup.

**entries/entry.yaml.example** — Template with all fields and comments explaining each.

### Step 7: First Entry (api-go-fiber at v1)

Build a minimal Go + Fiber entry implementing v1 (4 GET endpoints against SQLite). This proves the entire pipeline works end-to-end:

- `entries/api-go-fiber/main.go` — HTTP server on :8080, reads DB_PATH env var, 4 endpoints
- `entries/api-go-fiber/go.mod` — Module with fiber and go-sqlite3 dependencies
- `entries/api-go-fiber/Dockerfile` — Multi-stage build, copies schema+seed, initializes SQLite
- `entries/api-go-fiber/entry.yaml` — level: v1
- `entries/api-go-fiber/README.md` — Brief description
- `entries/api-go-fiber/db/` — Copies of schema.sql and seed-small.sql

**Validation**: Build Docker image, run container, execute `./validate/run.sh http://localhost:8080 --level v1` and confirm all tests pass.

## Execution Order

Steps 1-4 can be done in parallel (no dependencies between them). Step 5 depends on Step 4 (validator needs to know expected data). Step 6 is independent. Step 7 depends on Steps 4 and 5 (needs schema/seeds and validator to verify).

```
[1: Scaffolding] ──┐
[2: GitHub]     ───┤
[3: Spec]       ───┼──→ [5: Validator] ──→ [7: First Entry + Validation]
[4: DB Seeds]   ───┘         ↑
[6: Templates]  ─────────────┘
```

## Success Criteria

1. `db/schema.sql` + all seed files exist and are valid SQL
2. `validate/run.sh http://localhost:8080 --detect` works correctly against a running entry
3. `entries/api-go-fiber/` builds, runs, and passes v1 validation
4. GitHub Actions workflow is configured (won't test until pushed to GitHub)
5. All repository scaffolding files are in place
