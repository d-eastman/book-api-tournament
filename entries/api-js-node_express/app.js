const express = require('express');
const Database = require('better-sqlite3');

const app = express();
const PORT = 8080;
const DB_PATH = process.env.DB_PATH || '/app/books.db';

const db = new Database(DB_PATH);

app.use(express.json());

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

// GET /api/books - all books (paginated without keyword, flat array with keyword)
app.get('/api/books', (req, res) => {
  const { keyword } = req.query;
  if (keyword) {
    const books = db.prepare(
      "SELECT id, title, author_id AS authorId, genre, year, description FROM books WHERE LOWER(title) LIKE '%' || LOWER(?) || '%' OR LOWER(genre) LIKE '%' || LOWER(?) || '%' OR LOWER(description) LIKE '%' || LOWER(?) || '%'"
    ).all(keyword, keyword, keyword);
    return res.json(books);
  }
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const totalItems = db.prepare('SELECT COUNT(*) AS count FROM books').get().count;
  const totalPages = Math.ceil(totalItems / limit);
  const data = db.prepare('SELECT id, title, author_id AS authorId, genre, year, description FROM books ORDER BY id LIMIT ? OFFSET ?').all(limit, offset);
  res.json({ data, page, limit, totalItems, totalPages });
});

// POST /api/books - create a book
app.post('/api/books', (req, res) => {
  const { title, authorId, genre, year, description } = req.body;
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required' });
  }
  if (authorId === undefined || authorId === null) {
    return res.status(400).json({ error: 'authorId is required' });
  }
  if (!genre || typeof genre !== 'string' || genre.trim() === '') {
    return res.status(400).json({ error: 'genre is required' });
  }
  if (year === undefined || year === null) {
    return res.status(400).json({ error: 'year is required' });
  }
  if (!description || typeof description !== 'string' || description.trim() === '') {
    return res.status(400).json({ error: 'description is required' });
  }
  const author = db.prepare('SELECT id FROM authors WHERE id = ?').get(authorId);
  if (!author) {
    return res.status(400).json({ error: 'Invalid authorId' });
  }
  if (year < 1000 || year > 9999) {
    return res.status(400).json({ error: 'year must be between 1000 and 9999' });
  }
  const info = db.prepare('INSERT INTO books (title, author_id, genre, year, description) VALUES (?, ?, ?, ?, ?)').run(title, authorId, genre, year, description);
  const book = db.prepare('SELECT id, title, author_id AS authorId, genre, year, description FROM books WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(book);
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

// GET /api/stats - aggregate statistics
app.get('/api/stats', (req, res) => {
  const totalAuthors = db.prepare('SELECT COUNT(*) AS count FROM authors').get().count;
  const totalBooks = db.prepare('SELECT COUNT(*) AS count FROM books').get().count;
  const years = db.prepare('SELECT MIN(year) AS min, MAX(year) AS max, AVG(year) AS avg FROM books').get();
  const genreRows = db.prepare('SELECT genre, COUNT(*) AS count FROM books GROUP BY genre').all();
  const authorRows = db.prepare('SELECT a.name, COUNT(b.id) AS count FROM authors a JOIN books b ON a.id = b.author_id GROUP BY a.id, a.name').all();

  const booksByGenre = {};
  genreRows.forEach(r => booksByGenre[r.genre] = r.count);

  const authorsByBookCount = {};
  authorRows.forEach(r => authorsByBookCount[r.name] = r.count);

  res.json({
    totalAuthors,
    totalBooks,
    earliestYear: years.min,
    latestYear: years.max,
    averageYear: Math.round(years.avg * 100) / 100,
    booksByGenre,
    authorsByBookCount
  });
});

app.listen(PORT, () => {
  console.log(`api-js-node_express listening on port ${PORT}`);
});
