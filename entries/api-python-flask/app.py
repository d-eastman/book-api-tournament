import os
import sqlite3
from flask import Flask, jsonify

app = Flask(__name__)

DB_PATH = os.environ.get("DB_PATH", "/app/books.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@app.route("/api/authors")
def get_authors():
    conn = get_db()
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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
