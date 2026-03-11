import os
import sqlite3
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI()

DB_PATH = os.environ.get("DB_PATH", "/app/books.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@app.get("/api/authors")
def get_authors():
    conn = get_db()
    rows = conn.execute("SELECT id, name, bio FROM authors").fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.get("/api/authors/{author_id}")
def get_author(author_id: int):
    conn = get_db()
    row = conn.execute("SELECT id, name, bio FROM authors WHERE id = ?", (author_id,)).fetchone()
    conn.close()
    if row is None:
        return JSONResponse(status_code=404, content={"error": "Author not found"})
    return dict(row)


@app.get("/api/books")
def get_books():
    conn = get_db()
    rows = conn.execute("SELECT id, title, author_id, genre, year, description FROM books").fetchall()
    conn.close()
    return [
        {
            "id": row["id"],
            "title": row["title"],
            "authorId": row["author_id"],
            "genre": row["genre"],
            "year": row["year"],
            "description": row["description"],
        }
        for row in rows
    ]


@app.get("/api/books/{book_id}")
def get_book(book_id: int):
    conn = get_db()
    row = conn.execute("SELECT id, title, author_id, genre, year, description FROM books WHERE id = ?", (book_id,)).fetchone()
    conn.close()
    if row is None:
        return JSONResponse(status_code=404, content={"error": "Book not found"})
    return {
        "id": row["id"],
        "title": row["title"],
        "authorId": row["author_id"],
        "genre": row["genre"],
        "year": row["year"],
        "description": row["description"],
    }
