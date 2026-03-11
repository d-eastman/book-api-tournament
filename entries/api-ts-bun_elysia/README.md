# api-ts-bun_elysia

Book API implementation using **Elysia** on the **Bun** runtime.

## Level: v1

Four read-only endpoints backed by SQLite via Bun's built-in `bun:sqlite` module.

## Stack

- **Runtime:** Bun
- **Framework:** Elysia
- **Database:** SQLite (bun:sqlite)

## Run

```bash
docker build -t api-ts-bun_elysia .
docker run -p 8080:8080 api-ts-bun_elysia
```
