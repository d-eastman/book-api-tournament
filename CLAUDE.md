# CLAUDE.md — Book API Tournament

## Project Identity

This is the **Book API Tournament** — an open benchmarking arena where identical REST API implementations compete head-to-head across languages and frameworks. One API spec, many implementations, all benchmarked on the same hardware, scored in a March Madness-style tournament bracket.

The project serves three purposes:
1. **Education** — Understand the real-world tradeoffs between languages, runtimes, and frameworks through controlled comparison
2. **Community** — Invite engineers to contribute their own implementations and join the tournament
3. **Presentation** — Power a lunch-and-learn talk titled "One API, 28 Frameworks, 9 Languages: What I Learned Building the Same Thing Everywhere"

---

## Repository Structure

```
book-api-tournament/
├── .github/
│   ├── CODEOWNERS                      # Maintainer owns everything; protects spec, validator, etc.
│   ├── PULL_REQUEST_TEMPLATE.md        # Checklist for entry submissions
│   └── workflows/
│       └── validate-entry.yml          # CI: builds entry Docker image, runs validator on PR
├── spec/
│   ├── SPEC.md                         # The API contract (single source of truth)
│   └── CHANGELOG.md                    # Spec version history
├── db/
│   ├── schema.sql                      # CREATE TABLE statements
│   ├── seed-small.sql                  # 8 authors, 16 books (default)
│   ├── seed-medium.sql                 # 100 authors, 1,000 books
│   ├── seed-large.sql                  # 500 authors, 50,000 books
│   └── generate-seeds.py              # Deterministic generator (seed=42) for medium/large
├── validate/
│   ├── run.sh                          # Entry point: ./validate/run.sh http://localhost:8080
│   └── validator.py                    # Multi-phase correctness test suite
├── control-center/                     # Benchmark Control Center app (Hono + React)
│   ├── CONTROL-CENTER.md              # Detailed plan and architecture
│   ├── src/server/                    # Hono backend (Docker, benchmarking, results)
│   └── src/client/                    # React frontend (operator, tournament, results pages)
├── entries/                            # All API implementations live here
│   ├── api-go-fiber/                   # Example entry
│   ├── api-rust-actix/                 # Example entry
│   ├── ...
│   ├── Dockerfile.example              # Template for contributors
│   └── entry.yaml.example             # Metadata template for contributors
├── results/                            # Published benchmark results (CSV files)
├── hall-of-fame.md                     # Accepted entries and contributors
├── CONTRIBUTING.md                     # How to submit an entry
├── README.md                           # Project overview
├── LICENSE                             # MIT
└── CLAUDE.md                           # This file
```

---

## API Endpoints

Every entry implements all 8 endpoints, backed by SQLite.

**Endpoints (8):**
- `GET /api/authors` — All authors (flat array)
- `GET /api/authors/{id}` — Single author (404 if not found)
- `GET /api/authors?keyword=X` — Optional filter on `name`, `bio`
- `GET /api/authors/{id}/books` — Books by author (404 if author not found)
- `GET /api/books` — All books (paginated response: `{data, page, limit, totalItems, totalPages}` with `?page=1&limit=20` defaults)
- `GET /api/books/{id}` — Single book (404 if not found)
- `GET /api/books?keyword=X` — Optional filter on `title`, `genre`, `description` (returns flat array, not paginated)
- `GET /api/search?keyword=X` — Combined search across authors and books (400 if keyword missing)
- `POST /api/books` — Create a book with validation (201 on success, 400 on validation failure)
  - Required fields: `title`, `authorId`, `genre`, `year`, `description`
  - Validates: all fields present, authorId exists, year between 1000-9999
- `GET /api/stats` — Aggregate statistics (totalAuthors, totalBooks, earliestYear, latestYear, averageYear, booksByGenre, authorsByBookCount)

**Filtering rules:**
- Case-insensitive substring matching on specified fields only
- `year` and `id` fields are **never searched** by keyword filters
- Non-matching filters return **200 with empty array**, not 404

**Data:** SQLite database initialized from `db/schema.sql` + `db/seed-{size}.sql`. Benchmarked at small, medium, or large data sizes.

### Rules
- All JSON uses **camelCase** keys (`authorId`, not `author_id`)
- Error responses always use shape: `{"error": "message"}`
- Content-Type is always `application/json`

### Database
- SQLite, initialized from `db/schema.sql` + `db/seed-{size}.sql`
- Database path configured via `DB_PATH` env var (default: `/app/books.db`)
- Column `author_id` in SQL maps to `authorId` in JSON
- Data size (small, medium, large) is selected at benchmark time by the operator

Full spec details are in `spec/SPEC.md`. Architecture and benchmarking details are in `control-center/CONTROL-CENTER.md`.

---

## Data

### SQLite Data Sizes

The operator selects the data size at benchmark time.

| Size | Authors | Books | Purpose |
|------|---------|-------|---------|
| **small** | 8 | 16 | Validator correctness, framework overhead benchmarks |
| **medium** | 100 | 1,000 | Realistic API workload, serialization cost |
| **large** | 500 | 50,000 | Stress test: memory, GC pressure, streaming |

All three sizes are initialized from `db/schema.sql` + `db/seed-{size}.sql`. The small seed includes 8 authors (Butler, Morrison, Jemisin, Baldwin, Le Guin, Murakami, Adichie, Pratchett) and 16 total books.

Medium and large are generated deterministically by `db/generate-seeds.py` (uses `random.Random(42)` for reproducibility). Regenerate with: `python3 db/generate-seeds.py`

### Small Seed Reference (8 Authors, 16 Books)

### Authors
| ID | Name | Notable Bio Keywords |
|----|------|---------------------|
| 1 | Octavia Butler | science fiction, African American |
| 2 | Toni Morrison | Nobel Prize, Black identity |
| 3 | N.K. Jemisin | Hugo Award, Broken Earth |
| 4 | James Baldwin | racial, social issues |
| 5 | Ursula K. Le Guin | science fiction, fantasy, gender |
| 6 | Haruki Murakami | Japanese, surreal |
| 7 | Chimamanda Ngozi Adichie | Nigerian, feminist, identity |
| 8 | Terry Pratchett | British, Discworld |

### Books (2 per author)
| ID | Title | Author | Genre | Year |
|----|-------|--------|-------|------|
| 1 | Kindred | Butler | Science Fiction | 1979 |
| 2 | Parable of the Sower | Butler | Science Fiction | 1993 |
| 3 | Beloved | Morrison | Literary Fiction | 1987 |
| 4 | Song of Solomon | Morrison | Literary Fiction | 1977 |
| 5 | The Fifth Season | Jemisin | Fantasy | 2015 |
| 6 | The City We Became | Jemisin | Urban Fantasy | 2020 |
| 7 | Go Tell It on the Mountain | Baldwin | Literary Fiction | 1953 |
| 8 | Giovanni's Room | Baldwin | Literary Fiction | 1956 |
| 9 | The Left Hand of Darkness | Le Guin | Science Fiction | 1969 |
| 10 | A Wizard of Earthsea | Le Guin | Fantasy | 1968 |
| 11 | Norwegian Wood | Murakami | Literary Fiction | 1987 |
| 12 | Kafka on the Shore | Murakami | Magical Realism | 2002 |
| 13 | Americanah | Adichie | Literary Fiction | 2013 |
| 14 | Half of a Yellow Sun | Adichie | Historical Fiction | 2006 |
| 15 | Going Postal | Pratchett | Fantasy | 2004 |
| 16 | Small Gods | Pratchett | Fantasy | 1992 |

### Expected Stats (Small Seed)
- totalAuthors: 8
- totalBooks: 16
- earliestYear: 1953
- latestYear: 2020
- averageYear: 1987.25
- Genres: Fantasy (4), Literary Fiction (6), Science Fiction (4), Urban Fantasy (1), Historical Fiction (1), Magical Realism (1)

### Key Filter Expectations
- `keyword=butler` on authors → 1 result (Octavia Butler)
- `keyword=hugo` on authors → matches N.K. Jemisin (bio contains "Hugo Award")
- `keyword=fantasy` on books → 4 results (genre match)
- `keyword=magical realism` on books → 1 result (Kafka on the Shore)
- `keyword=tortoise` on books → 1 result (Small Gods, description match)
- `keyword=1987` on books → 0 results (year is NOT searched)
- `keyword=science fiction` on search → authors AND books (matches bios and genres)

---

---

## Validator

The validator (`validate/validator.py`) is a zero-dependency Python script that tests an API for spec compliance.

```bash
./validate/run.sh http://localhost:8080                              # run all tests
./validate/run.sh http://localhost:8080 --verbose                    # show individual tests
```

### Validator Phases

| Phase | What It Checks |
|-------|---------------|
| 1. Smoke Test | API reachable, returns JSON, correct Content-Type |
| 2. Read Correctness | All authors, each by ID, all books, each by ID, camelCase keys |
| 3. Filter Correctness | Keyword on name/bio/title/genre/description; case insensitivity; year NOT searched |
| 4. Search Correctness | GET /api/search returns authors and books; 400 for missing keyword |
| 5. Relationship | GET /api/authors/{id}/books; 404 for missing author |
| 6. Write Correctness | POST returns 201, generated ID, persistence; missing fields → 400; invalid author → 400 |
| 7. Compute (Stats) | Correct totals, min/max year, average, booksByGenre, authorsByBookCount |
| 8. Error Handling | 404 for missing resources, error field present in JSON |
| 9. Pagination | Default page/limit, custom limit, page 2, beyond last page, totalPages |

**Note:** The validator uses the small seed (8 authors / 16 books) as expected values.

---

## Entry Requirements

Every entry lives in `entries/api-{language}-{framework}/` and must contain:

### Required Files
- `Dockerfile` — Builds and runs on port 8080
- `entry.yaml` — Metadata
- `README.md` — Brief implementation description
- `db/schema.sql` + `db/seed-small.sql` — Copied from repo root

### entry.yaml

```yaml
framework: "Fiber"
language: "Go"
version: "2.52.5"
author: "Your Name"
repo: ""                     # optional: link to source
notes: ""                    # optional: implementation notes
```

### Dockerfile Pattern
```dockerfile
# Build stage
FROM <build-image> AS build
WORKDIR /app
COPY . .
RUN <build-commands>

# Runtime stage
FROM <runtime-image>
WORKDIR /app
RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*  # if needed
COPY db/schema.sql db/seed-small.sql /app/db/
RUN cat /app/db/schema.sql /app/db/seed-small.sql | sqlite3 /app/books.db
COPY --from=build /app/<artifact> .
ENV DB_PATH=/app/books.db
EXPOSE 8080
CMD ["./<binary>"]
```

### Directory Naming Convention
- `api-go-fiber`, `api-rust-actix`, `api-python-fastapi`
- Standard library: `api-go-stdlib`, `api-c-stdlib`
- Multiple frameworks in same language: each gets its own directory

---

## Benchmarking

All benchmarking is managed through the **Control Center** app (`control-center/`). See `control-center/CONTROL-CENTER.md` for the full architecture and API.

### Modes
- **Quick mode** — 2,000 requests, 20 concurrency. ~15 seconds per entry. For smoke tests, development, and tournament matchups.
- **Full mode** — 20,000 requests, 50 concurrency. ~90 seconds per entry. For official season results.

### Endpoints Benchmarked
All 8 endpoints: GET authors, GET books, GET author by ID, GET book by ID, search, author's books, POST books, stats.

### Metrics Captured
- **Throughput**: requests/second per endpoint
- **Latency**: avg, p50, p95, p99 in milliseconds
- **Memory**: idle and under load (from `docker stats`)
- **Startup time**: time from `docker run` to first successful response
- **Image size**: Docker image size in MB

### Competition Rules
- All entries implement the same spec and compete against each other.
- The operator selects **data size** when setting up a benchmark or tournament.

### Who Runs Official Benchmarks
**Only the maintainer.** Contributors submit code, the maintainer benchmarks on controlled hardware. Self-reported benchmarks are not accepted for official season results.

### Developer Self-Benchmarking
Contributors can use the Control Center's operator mode to run quick-mode benchmarks on their own entry during development. These results are for the developer's own use and are not submitted as official results.

---

## Tournament Format

### How Tournaments Work

Each tournament is configured with:
1. **Data size** (small, medium, or large)
3. **Mode** (quick or full) — how many requests per benchmark
4. **Winning metric** — what determines who advances (selected from dropdown)
5. **Benchmark endpoint** — which specific endpoint's metric is used for scoring

### Winning Metric Options
- Throughput (req/s) — higher wins
- p99 Latency (ms) — lower wins
- p95 Latency (ms) — lower wins
- Average Latency (ms) — lower wins
- Memory Under Load (MiB) — lower wins
- Startup Time (ms) — lower wins
- Image Size (MB) — lower wins
- Efficiency (req/s per MiB) — higher wins

### Bracket Structure
- Single elimination, next-power-of-2 bracket size
- Byes assigned randomly when entry count doesn't fill the bracket
- Entries shuffled randomly into bracket positions (no seeding)
- Matchups executed sequentially (entry A benchmarked, then entry B, then compared)

### Seasons
- **Season 1**: Initial entries benchmarked after migration
- **Season 2+**: New entries, community contributions, advanced experiments

---

## Contribution Workflow

### For the maintainer (you)
1. Add entries under `entries/api-{language}-{framework}/`
2. Run validator locally to confirm correctness
3. Commit directly to main (or PR for your own review discipline)
4. Periodically run `benchmark/bench.sh` against all entries on your hardware
5. Publish results to `results/season-N/`
6. Update `hall-of-fame.md`

### For external contributors
1. Fork the repo
2. Create their entry under `entries/`
3. Run the validator locally until all tests pass
4. Open a PR (CI builds their image and runs the validator automatically)
5. PR is blocked if it modifies anything outside `entries/`
6. Maintainer reviews, merges, and benchmarks on their hardware
7. Results published in next season

### Protection
- `.github/CODEOWNERS` requires maintainer approval on all files
- CI workflow rejects PRs that touch `spec/`, `validate/`, `benchmark/`, `results/`, or root files
- Branch protection on main: require PR reviews, require CI pass, no direct push

---

## Phased Build Plan

### Phase 1: Foundation (current)
- [x] CLAUDE.md (this file)
- [ ] Repository structure (README, CONTRIBUTING, LICENSE, .github/)
- [ ] SPEC.md (full API contract)
- [ ] Database schema and all seed files (small/medium/large as SQL)
- [ ] Validator
- [ ] GitHub Actions CI workflow
- [ ] First entry: add one simple implementation to validate the pipeline end-to-end

### Phase 2: Migration
- [ ] Migrate existing 44 implementations into `entries/` with full spec (all 8 endpoints)
- [ ] Validate each entry passes the validator
- [ ] Start with mainstream frameworks (Go, Rust, Node, Python, C#, Kotlin/JVM)
- [ ] Exotic entries (COBOL, assembly, Lua) must add SQLite support or be excluded

### Phase 3: Control Center App
- [ ] Hono backend (Docker lifecycle, benchmark runner, results store)
- [ ] Operator page (entry selection, batch benchmarking, results table)
- [ ] Tournament page (bracket creation, matchup-by-matchup execution, winner reveal)
- [ ] Results page (historical results viewer, tournament bracket replays)
- [ ] Quick mode and full mode benchmarking
- [ ] Run first official benchmarks, publish Season 1 results

### Phase 4: Community
- [ ] Publish repo publicly
- [ ] Announce at lunch-and-learn
- [ ] Accept first external contributions
- [ ] Run Season 2 benchmarks with community entries

### Phase 5: Advanced Experiments (optional)
- [ ] Concurrency experiments (simulated latency)
- [ ] Database tier benchmarks (small vs medium vs large)
- [ ] Observability comparison
- [ ] GraalVM native image variants for Quarkus, Micronaut, Spring

---

## Current Entries (to be migrated)

These 44 implementations exist from the initial project and need to be migrated into `entries/`, updated to use SQLite, and extended with POST/stats/pagination endpoints:

### Kotlin/JVM (10)
api-kotlin-spring, api-kotlin-ktor, api-kotlin-http4k, api-kotlin-micronaut, api-kotlin-quarkus, api-kotlin-vertx, api-kotlin-javalin, api-kotlin-helidon, api-kotlin-spark, api-kotlin-dropwizard

### Java/JVM (2)
api-java-spring, api-graalvm-java-spring

### Node.js/TypeScript (4)
api-node-express, api-node-fastify, api-node-hono, api-node-nestjs

### Bun/TypeScript (1)
api-bun-elysia

### Python (3)
api-python-django, api-python-fastapi, api-python-flask

### Go (5)
api-go-nethttp, api-go-gin, api-go-echo, api-go-fiber, api-go-chi

### C#/.NET (2)
api-csharp-minimal, api-csharp-webapi

### Rust (2)
api-rust-actix, api-rust-axum

### Swift (1)
api-swift-vapor

### Zig (1)
api-zig-zap

### C (1)
api-c

### C++ (1)
api-cpp

### Crystal (1)
api-crystal-kemal

### Haskell (1)
api-haskell-servant

### Clojure (2)
api-clojure-ring-compojure, api-clojure-ring-reitit

### Perl (2)
api-perl-dancer2, api-perl-mojolicious

### Lua (1)
api-lua-openresty

### Ruby (1)
api-ruby-rails

### PHP (1)
api-php-laravel

### Elixir (1)
api-elixir-phoenix

### COBOL (1)
api-cobol-wheelchair

### Assembly (1)
api-assembly-rwasa

---

## Developer Workflow

Whether you're the maintainer building entries or an external contributor, here's the development loop:

### Quick Start (build → validate → benchmark)

```bash
# 1. Start your API (however it runs — local binary, docker, etc.)
cd entries/api-your-framework
docker build -t api-your-framework .
docker run -p 8080:8080 api-your-framework

# 2. Validate (in another terminal)
./validate/run.sh http://localhost:8080

# 3. Quick-mode self-benchmark (for your own reference, not official results)
#    Use the Control Center UI:
cd control-center
npm run dev
#    Open http://localhost:5173/operator
#    Select your entry, choose Quick mode, click Run
```

### Development Order

Build incrementally, running `./validate/run.sh http://localhost:8080 --verbose` after each step:

1. Set up SQLite (copy `db/schema.sql` + `db/seed-small.sql`, initialize in Dockerfile)
2. `GET /api/authors` (list all from database) — smoke test
3. `GET /api/authors/{id}` — path params + 404 handling
4. `GET /api/books` and `GET /api/books/{id}` — second resource + camelCase `authorId`
5. `GET /api/authors?keyword=X` and `GET /api/books?keyword=X` — optional keyword filtering
6. `GET /api/authors/{id}/books` — relationship query + 404 if author missing
7. `GET /api/search?keyword=X` — combined search + 400 for missing keyword
8. Pagination on `GET /api/books` — paginated wrapper object when no keyword
9. `POST /api/books` — request body parsing, validation rules, 201 response
10. `GET /api/stats` — aggregation queries (totalAuthors, booksByGenre, etc.)

---

## Working with Claude Code

When using Claude Code to implement entries:

1. **Always read this file first** — it contains the complete spec summary, expected data, and entry requirements
2. **Reference spec/SPEC.md** for any ambiguity in endpoint behavior
3. **Copy `db/schema.sql` and `db/seed-small.sql`** into the entry's `db/` directory
4. **Test with the validator**: `./validate/run.sh http://localhost:8080 --verbose`
5. **Match JSON keys exactly** — `authorId` not `author_id`, `totalItems` not `total_items`

### Common Implementation Mistakes

**General:**
- Returning `author_id` instead of `authorId` in JSON
- Content-Type not set to `application/json`
- Error responses not using `{"error": "message"}` shape

**Filtering:**
- Returning 404 instead of 200 with empty array for non-matching filters
- Missing the keyword-required check on GET /api/search (must return 400)
- Searching the `year` field (it should NOT be searched)
- Case-sensitive filtering (must be case-insensitive)

**Writes / Stats / Pagination:**
- Returning 200 instead of 201 for POST
- Not implementing pagination on GET /api/books (without keyword)
- Returning paginated wrapper on GET /api/books?keyword=X (should be flat array)
- Forgetting to validate that authorId references an existing author on POST
- Returning POST validation errors as 500 instead of 400
- Not rounding averageYear to 2 decimal places in stats
- Missing booksByGenre or authorsByBookCount in stats response
