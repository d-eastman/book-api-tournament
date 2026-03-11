# api-python-fastapi

Book API Tournament entry using Python with FastAPI and Uvicorn.

## Level: v1

Four read-only GET endpoints backed by SQLite, using Python's built-in `sqlite3` module.

## Run

```bash
docker build -t api-python-fastapi .
docker run -p 8080:8080 api-python-fastapi
```

## Validate

```bash
./validate/run.sh http://localhost:8080 --level v1
```
