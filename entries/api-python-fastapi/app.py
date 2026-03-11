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
def get_authors(keyword: str = None):
    conn = get_db()
    if keyword:
        rows = conn.execute(
            "SELECT id, name, bio FROM authors WHERE LOWER(name) LIKE '%' || LOWER(?) || '%' OR LOWER(bio) LIKE '%' || LOWER(?) || '%'",
            (keyword, keyword),
        ).fetchall()
    else:
        rows = conn.execute("SELECT id, name, bio FROM authors").fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.get("/api/authors/{author_id}/books")
def get_author_books(author_id: int):
    conn = get_db()
    author = conn.execute("SELECT id FROM authors WHERE id = ?", (author_id,)).fetchone()
    if author is None:
        conn.close()
        return JSONResponse(status_code=404, content={"error": "Author not found"})
    rows = conn.execute(
        "SELECT id, title, author_id, genre, year, description FROM books WHERE author_id = ?",
        (author_id,),
    ).fetchall()
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


@app.get("/api/authors/{author_id}")
def get_author(author_id: int):
    conn = get_db()
    row = conn.execute("SELECT id, name, bio FROM authors WHERE id = ?", (author_id,)).fetchone()
    conn.close()
    if row is None:
        return JSONResponse(status_code=404, content={"error": "Author not found"})
    return dict(row)


@app.get("/api/books")
def get_books(keyword: str = None):
    conn = get_db()
    if keyword:
        rows = conn.execute(
            "SELECT id, title, author_id, genre, year, description FROM books WHERE LOWER(title) LIKE '%' || LOWER(?) || '%' OR LOWER(genre) LIKE '%' || LOWER(?) || '%' OR LOWER(description) LIKE '%' || LOWER(?) || '%'",
            (keyword, keyword, keyword),
        ).fetchall()
    else:
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


@app.get("/api/search")
def search(keyword: str = None):
    if keyword is None:
        return JSONResponse(status_code=400, content={"error": "keyword parameter is required"})
    conn = get_db()
    authors = conn.execute(
        "SELECT id, name, bio FROM authors WHERE LOWER(name) LIKE '%' || LOWER(?) || '%' OR LOWER(bio) LIKE '%' || LOWER(?) || '%'",
        (keyword, keyword),
    ).fetchall()
    books = conn.execute(
        "SELECT id, title, author_id, genre, year, description FROM books WHERE LOWER(title) LIKE '%' || LOWER(?) || '%' OR LOWER(genre) LIKE '%' || LOWER(?) || '%' OR LOWER(description) LIKE '%' || LOWER(?) || '%'",
        (keyword, keyword, keyword),
    ).fetchall()
    conn.close()
    return {
        "authors": [dict(row) for row in authors],
        "books": [
            {
                "id": row["id"],
                "title": row["title"],
                "authorId": row["author_id"],
                "genre": row["genre"],
                "year": row["year"],
                "description": row["description"],
            }
            for row in books
        ],
    }
