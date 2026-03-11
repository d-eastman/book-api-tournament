import math
import os
import sqlite3
from flask import Flask, jsonify, request

app = Flask(__name__)

DB_PATH = os.environ.get("DB_PATH", "/app/books.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@app.route("/api/authors")
def get_authors():
    conn = get_db()
    keyword = request.args.get("keyword")
    if keyword:
        rows = conn.execute(
            "SELECT id, name, bio FROM authors WHERE LOWER(name) LIKE '%' || LOWER(?) || '%' OR LOWER(bio) LIKE '%' || LOWER(?) || '%'",
            (keyword, keyword),
        ).fetchall()
    else:
        rows = conn.execute("SELECT id, name, bio FROM authors").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/authors/<int:author_id>")
def get_author(author_id):
    conn = get_db()
    row = conn.execute("SELECT id, name, bio FROM authors WHERE id = ?", (author_id,)).fetchone()
    conn.close()
    if row is None:
        return jsonify({"error": "Author not found"}), 404
    return jsonify(dict(row))


@app.route("/api/books", methods=["GET", "POST"])
def books_route():
    if request.method == "POST":
        return create_book()
    return get_books()


def get_books():
    conn = get_db()
    keyword = request.args.get("keyword")
    if keyword:
        rows = conn.execute(
            "SELECT id, title, author_id, genre, year, description FROM books WHERE LOWER(title) LIKE '%' || LOWER(?) || '%' OR LOWER(genre) LIKE '%' || LOWER(?) || '%' OR LOWER(description) LIKE '%' || LOWER(?) || '%'",
            (keyword, keyword, keyword),
        ).fetchall()
        conn.close()
        books = []
        for r in rows:
            book = dict(r)
            book["authorId"] = book.pop("author_id")
            books.append(book)
        return jsonify(books)
    else:
        page = request.args.get("page", 1, type=int)
        limit = request.args.get("limit", 20, type=int)
        offset = (page - 1) * limit
        total_items = conn.execute("SELECT COUNT(*) FROM books").fetchone()[0]
        rows = conn.execute(
            "SELECT id, title, author_id, genre, year, description FROM books ORDER BY id LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
        conn.close()
        books = []
        for r in rows:
            book = dict(r)
            book["authorId"] = book.pop("author_id")
            books.append(book)
        total_pages = math.ceil(total_items / limit)
        return jsonify({
            "data": books,
            "page": page,
            "limit": limit,
            "totalItems": total_items,
            "totalPages": total_pages,
        })


def create_book():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    title = data.get("title")
    author_id = data.get("authorId")
    genre = data.get("genre")
    year = data.get("year")
    description = data.get("description")

    if not title or (isinstance(title, str) and title.strip() == ""):
        return jsonify({"error": "title is required"}), 400
    if author_id is None:
        return jsonify({"error": "authorId is required"}), 400
    if not genre or (isinstance(genre, str) and genre.strip() == ""):
        return jsonify({"error": "genre is required"}), 400
    if year is None:
        return jsonify({"error": "year is required"}), 400
    if not description or (isinstance(description, str) and description.strip() == ""):
        return jsonify({"error": "description is required"}), 400

    if not isinstance(year, int) or year < 1000 or year > 9999:
        return jsonify({"error": "year must be between 1000 and 9999"}), 400

    conn = get_db()
    author = conn.execute("SELECT id FROM authors WHERE id = ?", (author_id,)).fetchone()
    if author is None:
        conn.close()
        return jsonify({"error": "Invalid authorId"}), 400

    cursor = conn.execute(
        "INSERT INTO books (title, author_id, genre, year, description) VALUES (?, ?, ?, ?, ?)",
        (title, author_id, genre, year, description),
    )
    conn.commit()
    book_id = cursor.lastrowid
    conn.close()

    return jsonify({
        "id": book_id,
        "title": title,
        "authorId": author_id,
        "genre": genre,
        "year": year,
        "description": description,
    }), 201


@app.route("/api/books/<int:book_id>")
def get_book(book_id):
    conn = get_db()
    row = conn.execute("SELECT id, title, author_id, genre, year, description FROM books WHERE id = ?", (book_id,)).fetchone()
    conn.close()
    if row is None:
        return jsonify({"error": "Book not found"}), 404
    book = dict(row)
    book["authorId"] = book.pop("author_id")
    return jsonify(book)


@app.route("/api/authors/<int:author_id>/books")
def get_author_books(author_id):
    conn = get_db()
    author = conn.execute("SELECT id FROM authors WHERE id = ?", (author_id,)).fetchone()
    if author is None:
        conn.close()
        return jsonify({"error": "Author not found"}), 404
    rows = conn.execute(
        "SELECT id, title, author_id, genre, year, description FROM books WHERE author_id = ?",
        (author_id,),
    ).fetchall()
    conn.close()
    books = []
    for r in rows:
        book = dict(r)
        book["authorId"] = book.pop("author_id")
        books.append(book)
    return jsonify(books)


@app.route("/api/search")
def search():
    keyword = request.args.get("keyword")
    if not keyword:
        return jsonify({"error": "keyword parameter is required"}), 400
    conn = get_db()
    authors = conn.execute(
        "SELECT id, name, bio FROM authors WHERE LOWER(name) LIKE '%' || LOWER(?) || '%' OR LOWER(bio) LIKE '%' || LOWER(?) || '%'",
        (keyword, keyword),
    ).fetchall()
    book_rows = conn.execute(
        "SELECT id, title, author_id, genre, year, description FROM books WHERE LOWER(title) LIKE '%' || LOWER(?) || '%' OR LOWER(genre) LIKE '%' || LOWER(?) || '%' OR LOWER(description) LIKE '%' || LOWER(?) || '%'",
        (keyword, keyword, keyword),
    ).fetchall()
    conn.close()
    books = []
    for r in book_rows:
        book = dict(r)
        book["authorId"] = book.pop("author_id")
        books.append(book)
    return jsonify({"authors": [dict(a) for a in authors], "books": books})


@app.route("/api/stats")
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

    return jsonify({
        "totalAuthors": total_authors,
        "totalBooks": total_books,
        "earliestYear": year_stats[0],
        "latestYear": year_stats[1],
        "averageYear": round(year_stats[2], 2),
        "booksByGenre": {row[0]: row[1] for row in genre_rows},
        "authorsByBookCount": {row[0]: row[1] for row in author_rows},
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
