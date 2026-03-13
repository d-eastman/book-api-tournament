# Contributing to Book API Tournament

Thank you for your interest in contributing an entry. This guide covers everything you need to submit an API implementation.

## Overview

You implement the Book API spec in your language and framework of choice, package it in a Docker container, validate it against the test suite, and open a pull request. The maintainer benchmarks accepted entries on controlled hardware and publishes results.

## Steps

### 1. Fork and clone

```bash
git clone https://github.com/YOUR_USERNAME/book-api-tournament.git
cd book-api-tournament
```

### 2. Create your entry directory

```bash
mkdir entries/api-{language}-{framework}
```

Use the naming convention: `api-go-fiber`, `api-rust-actix`, `api-python-fastapi`. For standard library implementations, use `api-go-stdlib`, `api-c-stdlib`.

### 3. Implement the API

Every entry implements the full API spec: 8 endpoints backed by SQLite. Read [spec/SPEC.md](spec/SPEC.md) for the complete contract.

Your entry must:

- Listen on port **8080**
- Return `Content-Type: application/json` on all responses
- Use **camelCase** JSON keys (`authorId`, not `author_id`)
- Return errors as `{"error": "message"}`
- Read the database path from `DB_PATH` env var (default: `/app/books.db`)

### 4. Required files

Your entry directory must contain:

#### `Dockerfile`

Builds and runs your API on port 8080.

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

#### `entry.yaml`

```yaml
framework: "Fiber"
language: "Go"
version: "2.52.5"
author: "Your Name"
repo: ""                     # optional: link to source
notes: ""                    # optional: implementation notes
```

#### `README.md`

A brief description of your implementation: language, framework, any notable design choices.

#### `db/schema.sql` and `db/seed-small.sql`

Copy these from the repository root:

```bash
mkdir entries/api-your-framework/db
cp db/schema.sql entries/api-your-framework/db/
cp db/seed-small.sql entries/api-your-framework/db/
```

### 5. Validate your entry

Copy the build-and-validate script into your entry directory:

```bash
cp entries/build-and-validate.sh.example entries/api-your-framework/build-and-validate.sh
chmod +x entries/api-your-framework/build-and-validate.sh
```

Then run it from your entry directory:

```bash
cd entries/api-your-framework
./build-and-validate.sh
```

This builds the Docker image, starts the container, runs the validator, and cleans up after itself. You can pass extra flags:

```bash
./build-and-validate.sh --verbose          # show individual test results
```

All tests must pass before opening a PR.

### 6. Open a pull request

Push your branch and open a PR. CI will automatically build your Docker image and run the validator.

## PR Rules

- Your PR **must only modify files under `entries/`**. PRs that touch `spec/`, `validate/`, `results/`, or root files will be rejected by CI.
- All validator tests must pass.
- The maintainer reviews, merges, and benchmarks on controlled hardware.
- Results are published in the next season.

## Development Tips

- Run `./validate/run.sh http://localhost:8080 --verbose` to see exactly which tests are failing.
- Check [CLAUDE.md](CLAUDE.md) for common implementation mistakes and the full data reference.
- The small seed (8 authors, 16 books) is used for all validator tests.

## What Happens After Your PR Is Merged

1. The maintainer benchmarks your entry on controlled hardware alongside all other entries.
2. Results (throughput, latency, memory, startup time, image size) are published to `results/`.
3. Your entry is added to the [Hall of Fame](hall-of-fame.md).
4. Your entry competes in tournament brackets against other entries.
