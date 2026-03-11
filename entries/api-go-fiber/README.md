# api-go-fiber

Go + [Fiber](https://gofiber.io/) v2 implementation of the Book API.

**Level:** v1 (4 GET endpoints against SQLite)

## Stack
- Go 1.22
- Fiber v2.52.5
- go-sqlite3 (CGO)

## Run locally
```bash
docker build -t api-go-fiber .
docker run -p 8080:8080 api-go-fiber
```

## Validate
```bash
./validate/run.sh http://localhost:8080 --level v1
```
