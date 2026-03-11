# Book API Tournament

An open benchmarking arena where identical REST API implementations compete head-to-head across languages and frameworks. One API spec, many implementations, all benchmarked on the same hardware, scored in a March Madness-style tournament bracket.

## What Is This?

Every entry implements the same Book API — a simple REST service for managing authors and books backed by SQLite. Entries are written in different languages and frameworks, then benchmarked for throughput, latency, memory usage, startup time, and image size. Winners advance through a single-elimination tournament bracket.

The project serves three purposes:

- **Education** — Understand real-world tradeoffs between languages, runtimes, and frameworks through controlled comparison
- **Community** — Invite engineers to contribute their own implementations and join the tournament
- **Presentation** — Power a lunch-and-learn titled "One API, 28 Frameworks, 9 Languages: What I Learned Building the Same Thing Everywhere"

## Entry Levels

Entries implement one of four levels, each building on the last:

| Level | Endpoints | Database | Description |
|-------|-----------|----------|-------------|
| **Hardcoded** | 4 | None | Proof-of-concept with in-memory data. Dead-end path. |
| **v1** | 4 | SQLite | Recommended starting point. Basic CRUD reads. |
| **v2** | 6 | SQLite | Adds filtering, search, and author-books relationship. |
| **v3** | 8 | SQLite | Full contract: writes, pagination, and aggregate stats. |

See [spec/SPEC.md](spec/SPEC.md) for the complete API contract.

## Quick Start

### 1. Create your entry

```bash
mkdir entries/api-{language}-{framework}
cd entries/api-{language}-{framework}

# Copy database files (skip for Hardcoded entries)
mkdir db
cp ../../db/schema.sql db/
cp ../../db/seed-small.sql db/

# Create your Dockerfile, entry.yaml, README.md, and source code
```

### 2. Build and run

```bash
docker build -t api-your-framework .
docker run -p 8080:8080 api-your-framework
```

### 3. Validate

```bash
# Auto-detect the highest level your API supports
./validate/run.sh http://localhost:8080 --detect

# Or validate a specific level
./validate/run.sh http://localhost:8080 --level v1
./validate/run.sh http://localhost:8080 --level v2
./validate/run.sh http://localhost:8080 --level v3
```

### 4. Benchmark

```bash
cd control-center
npm run dev
# Open http://localhost:5173/operator
# Select your entry, choose Quick mode, click Run
```

## Repository Structure

```
book-api-tournament/
├── spec/           # API contract (single source of truth)
├── db/             # Schema and seed files (small, medium, large)
├── validate/       # Correctness test suite
├── control-center/ # Benchmark and tournament management app
├── entries/        # All API implementations
├── results/        # Published benchmark results
└── hall-of-fame.md # Accepted entries and contributors
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to submit an entry.

## Key Links

- [API Spec](spec/SPEC.md) — The complete API contract
- [Contributing Guide](CONTRIBUTING.md) — How to submit an entry
- [Project Instructions](CLAUDE.md) — Full project context and architecture
- [Hall of Fame](hall-of-fame.md) — Accepted entries and contributors

## License

[MIT](LICENSE)
