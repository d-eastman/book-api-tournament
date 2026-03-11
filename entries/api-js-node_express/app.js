const express = require('express');
const Database = require('better-sqlite3');

const app = express();
const PORT = 8080;
const DB_PATH = process.env.DB_PATH || '/app/books.db';

const db = new Database(DB_PATH, { readonly: true });

// GET /api/authors - all authors
app.get('/api/authors', (req, res) => {
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

// GET /api/books - all books
app.get('/api/books', (req, res) => {
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

app.listen(PORT, () => {
  console.log(`api-js-node_express listening on port ${PORT}`);
});
