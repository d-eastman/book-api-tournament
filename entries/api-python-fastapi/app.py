import math
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
def get_books(keyword: str = None, page: int = 1, limit: int = 20):
    conn = get_db()
    if keyword:
        rows = conn.execute(
            "SELECT id, title, author_id, genre, year, description FROM books WHERE LOWER(title) LIKE '%' || LOWER(?) || '%' OR LOWER(genre) LIKE '%' || LOWER(?) || '%' OR LOWER(description) LIKE '%' || LOWER(?) || '%'",
            (keyword, keyword, keyword),
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
    else:
        total_items = conn.execute("SELECT COUNT(*) FROM books").fetchone()[0]
        total_pages = math.ceil(total_items / limit)
        offset = (page - 1) * limit
        rows = conn.execute(
            "SELECT id, title, author_id, genre, year, description FROM books ORDER BY id LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
        conn.close()
        data = [
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
        return {
            "data": data,
            "page": page,
            "limit": limit,
            "totalItems": total_items,
            "totalPages": total_pages,
        }


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


@app.post("/api/books")
async def create_book(request: Request):
    try:
        data = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"error": "Request body is required"})

    title = data.get("title")
    author_id = data.get("authorId")
    genre = data.get("genre")
    year = data.get("year")
    description = data.get("description")

    if not title or not isinstance(title, str) or title.strip() == "":
        return JSONResponse(status_code=400, content={"error": "title is required"})
    if author_id is None:
        return JSONResponse(status_code=400, content={"error": "authorId is required"})
    if not genre or not isinstance(genre, str) or genre.strip() == "":
        return JSONResponse(status_code=400, content={"error": "genre is required"})
    if year is None:
        return JSONResponse(status_code=400, content={"error": "year is required"})
    if not description or not isinstance(description, str) or description.strip() == "":
        return JSONResponse(status_code=400, content={"error": "description is required"})

    if not isinstance(year, int) or year < 1000 or year > 9999:
        return JSONResponse(status_code=400, content={"error": "year must be between 1000 and 9999"})

    conn = get_db()
    author = conn.execute("SELECT id FROM authors WHERE id = ?", (author_id,)).fetchone()
    if author is None:
        conn.close()
        return JSONResponse(status_code=400, content={"error": "Invalid authorId"})

    cursor = conn.execute(
        "INSERT INTO books (title, author_id, genre, year, description) VALUES (?, ?, ?, ?, ?)",
        (title, author_id, genre, year, description),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return JSONResponse(
        status_code=201,
        content={
            "id": new_id,
            "title": title,
            "authorId": author_id,
            "genre": genre,
            "year": year,
            "description": description,
        },
    )


@app.get("/api/stats")
def get_stats():
    conn = get_db()
    total_authors = conn.execute("SELECT COUNT(*) FROM authors").fetchone()[0]
    total_books = conn.execute("SELECT COUNT(*) FROM books").fetchone()[0]
    year_stats = conn.execute("SELECT MIN(year), MAX(year), AVG(year) FROM books").fetchone()
    genre_rows = conn.execute("SELECT genre, COUNT(*) FROM books GROUP BY genre").fetchall()
    author_rows = conn.execute(
        "SELECT a.name, COUNT(b.id) FROM authors a JOIN books b ON a.id = b.author_id GROUP BY a.id, a.name"
    ).fetchall()
    conn.close()
    return {
        "totalAuthors": total_authors,
        "totalBooks": total_books,
        "earliestYear": year_stats[0],
        "latestYear": year_stats[1],
        "averageYear": round(year_stats[2], 2),
        "booksByGenre": {row[0]: row[1] for row in genre_rows},
        "authorsByBookCount": {row[0]: row[1] for row in author_rows},
    }
