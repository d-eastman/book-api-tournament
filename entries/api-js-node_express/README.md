# api-js-node_express

Book API Tournament entry using Node.js with Express 4 and better-sqlite3.

## Level: v1

Implements the 4 core GET endpoints against SQLite:

- `GET /api/authors` — all authors
- `GET /api/authors/:id` — single author by ID
- `GET /api/books` — all books
- `GET /api/books/:id` — single book by ID

## Run

```bash
docker build -t api-js-node_express .
docker run -p 8080:8080 api-js-node_express
```

## Validate

```bash
./validate/run.sh http://localhost:8080 --level v1
```
