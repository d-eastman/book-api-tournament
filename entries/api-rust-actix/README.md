# api-rust-actix

Book API implementation using Rust with Actix Web 4 and rusqlite.

## Level: v1

Four read-only GET endpoints backed by SQLite.

## Stack

- **Actix Web 4** - HTTP framework
- **rusqlite** (bundled) - SQLite access with compiled-in SQLite
- **serde** - JSON serialization

## Build & Run

```bash
docker build -t api-rust-actix .
docker run -p 8080:8080 api-rust-actix
```

## Validate

```bash
./validate/run.sh http://localhost:8080 --level v1
```
