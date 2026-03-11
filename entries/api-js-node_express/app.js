const express = require('express');
const Database = require('better-sqlite3');

const app = express();
const PORT = 8080;
const DB_PATH = process.env.DB_PATH || '/app/books.db';

const db = new Database(DB_PATH, { readonly: true });

// GET /api/authors - all authors (with optional keyword filter)
app.get('/api/authors', (req, res) => {
  const { keyword } = req.query;
  if (keyword) {
    const authors = db.prepare(
      "SELECT id, name, bio FROM authors WHERE LOWER(name) LIKE '%' || LOWER(?) || '%' OR LOWER(bio) LIKE '%' || LOWER(?) || '%'"
    ).all(keyword, keyword);
    return res.json(authors);
  }
  const authors = db.prepare('SELECT id, name, bio FROM authors').all();
  res.json(authors);
});

// GET /api/authors/:id - single author
app.get('/api/authors/:id', (req, res) => {
  const author = db.prepare('SELECT id, name, bio FROM authors WHERE id = ?').get(req.params.id);
  if (!author) {
    return res.status(404).json({ error: 'Author not found' });
  }
  res.json(author);
});

// GET /api/books - all books (with optional keyword filter)
app.get('/api/books', (req, res) => {
  const { keyword } = req.query;
  if (keyword) {
    const books = db.prepare(
      "SELECT id, title, author_id AS authorId, genre, year, description FROM books WHERE LOWER(title) LIKE '%' || LOWER(?) || '%' OR LOWER(genre) LIKE '%' || LOWER(?) || '%' OR LOWER(description) LIKE '%' || LOWER(?) || '%'"
    ).all(keyword, keyword, keyword);
    return res.json(books);
  }
  const books = db.prepare('SELECT id, title, author_id AS authorId, genre, year, description FROM books').all();
  res.json(books);
});

// GET /api/books/:id - single book
app.get('/api/books/:id', (req, res) => {
  const book = db.prepare('SELECT id, title, author_id AS authorId, genre, year, description FROM books WHERE id = ?').get(req.params.id);
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }
  res.json(book);
});

// GET /api/authors/:id/books - books by author
app.get('/api/authors/:id/books', (req, res) => {
  const author = db.prepare('SELECT id FROM authors WHERE id = ?').get(req.params.id);
  if (!author) {
    return res.status(404).json({ error: 'Author not found' });
  }
  const books = db.prepare(
    'SELECT id, title, author_id AS authorId, genre, year, description FROM books WHERE author_id = ?'
  ).all(req.params.id);
  res.json(books);
});

// GET /api/search - combined search across authors and books
app.get('/api/search', (req, res) => {
  const { keyword } = req.query;
  if (!keyword) {
    return res.status(400).json({ error: 'keyword parameter is required' });
  }
  const authors = db.prepare(
    "SELECT id, name, bio FROM authors WHERE LOWER(name) LIKE '%' || LOWER(?) || '%' OR LOWER(bio) LIKE '%' || LOWER(?) || '%'"
  ).all(keyword, keyword);
  const books = db.prepare(
    "SELECT id, title, author_id AS authorId, genre, year, description FROM books WHERE LOWER(title) LIKE '%' || LOWER(?) || '%' OR LOWER(genre) LIKE '%' || LOWER(?) || '%' OR LOWER(description) LIKE '%' || LOWER(?) || '%'"
  ).all(keyword, keyword, keyword);
  res.json({ authors, books });
});

app.listen(PORT, () => {
  console.log(`api-js-node_express listening on port ${PORT}`);
});
