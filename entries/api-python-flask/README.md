# api-python-flask

A v1 Book API implementation using Python 3.12 and Flask 3.

## Stack
- **Framework:** Flask 3.1
- **Language:** Python 3.12
- **Database:** SQLite via Python's built-in `sqlite3` module

## Endpoints
- `GET /api/authors` - List all authors
- `GET /api/authors/{id}` - Get author by ID
- `GET /api/books` - List all books
- `GET /api/books/{id}` - Get book by ID

## Run
```bash
docker build -t api-python-flask .
docker run -p 8080:8080 api-python-flask
```
