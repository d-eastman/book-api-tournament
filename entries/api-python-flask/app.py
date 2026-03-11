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


@app.route("/api/books")
def get_books():
    conn = get_db()
    keyword = request.args.get("keyword")
    if keyword:
        rows = conn.execute(
            "SELECT id, title, author_id, genre, year, description FROM books WHERE LOWER(title) LIKE '%' || LOWER(?) || '%' OR LOWER(genre) LIKE '%' || LOWER(?) || '%' OR LOWER(description) LIKE '%' || LOWER(?) || '%'",
            (keyword, keyword, keyword),
        ).fetchall()
    else:
        rows = conn.execute("SELECT id, title, author_id, genre, year, description FROM books").fetchall()
    conn.close()
    books = []
    for r in rows:
        book = dict(r)
        book["authorId"] = book.pop("author_id")
        books.append(book)
    return jsonify(books)


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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
