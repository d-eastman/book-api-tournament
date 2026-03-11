import { Elysia } from "elysia";
import { Database } from "bun:sqlite";

const dbPath = Bun.env.DB_PATH ?? "/app/books.db";
const db = new Database(dbPath);

const app = new Elysia()
  .get("/api/authors", ({ query }) => {
    const keyword = query.keyword;
    if (keyword) {
      return db
        .query(
          "SELECT id, name, bio FROM authors WHERE LOWER(name) LIKE '%' || LOWER(?) || '%' OR LOWER(bio) LIKE '%' || LOWER(?) || '%'"
        )
        .all(keyword, keyword);
    }
    return db.query("SELECT id, name, bio FROM authors").all();
  })
  .get("/api/authors/:id", ({ params, set }) => {
    const author = db.query("SELECT id, name, bio FROM authors WHERE id = ?").get(params.id);
    if (!author) {
      set.status = 404;
      return { error: "Author not found" };
    }
    return author;
  })
  .get("/api/authors/:id/books", ({ params, set }) => {
    const author = db.query("SELECT id FROM authors WHERE id = ?").get(params.id);
    if (!author) {
      set.status = 404;
      return { error: "Author not found" };
    }
    return db
      .query(
        "SELECT id, title, author_id AS authorId, genre, year, description FROM books WHERE author_id = ?"
      )
      .all(params.id);
  })
  .get("/api/books", ({ query }) => {
    const keyword = query.keyword;
    if (keyword) {
      return db
        .query(
          "SELECT id, title, author_id AS authorId, genre, year, description FROM books WHERE LOWER(title) LIKE '%' || LOWER(?) || '%' OR LOWER(genre) LIKE '%' || LOWER(?) || '%' OR LOWER(description) LIKE '%' || LOWER(?) || '%'"
        )
        .all(keyword, keyword, keyword);
    }
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const totalItems = (db.query("SELECT COUNT(*) AS count FROM books").get() as any).count;
    const totalPages = Math.ceil(totalItems / limit);
    const data = db.query("SELECT id, title, author_id AS authorId, genre, year, description FROM books ORDER BY id LIMIT ? OFFSET ?").all(limit, offset);
    return { data, page, limit, totalItems, totalPages };
  })
  .post("/api/books", ({ body, set }) => {
    const { title, authorId, genre, year, description } = body as any;

    if (!title) { set.status = 400; return { error: "title is required" }; }
    if (authorId === undefined || authorId === null) { set.status = 400; return { error: "authorId is required" }; }
    if (!genre) { set.status = 400; return { error: "genre is required" }; }
    if (year === undefined || year === null) { set.status = 400; return { error: "year is required" }; }
    if (!description) { set.status = 400; return { error: "description is required" }; }

    const author = db.query("SELECT id FROM authors WHERE id = ?").get(authorId);
    if (!author) { set.status = 400; return { error: "Invalid authorId" }; }

    if (year < 1000 || year > 9999) { set.status = 400; return { error: "year must be between 1000 and 9999" }; }

    db.run("INSERT INTO books (title, author_id, genre, year, description) VALUES (?, ?, ?, ?, ?)", [title, authorId, genre, year, description]);

    const lastId = db.query("SELECT last_insert_rowid() AS id").get() as any;
    set.status = 201;
    return { id: lastId.id, title, authorId, genre, year, description };
  })
  .get("/api/books/:id", ({ params, set }) => {
    const book = db
      .query("SELECT id, title, author_id AS authorId, genre, year, description FROM books WHERE id = ?")
      .get(params.id);
    if (!book) {
      set.status = 404;
      return { error: "Book not found" };
    }
    return book;
  })
  .get("/api/search", ({ query, set }) => {
    const keyword = query.keyword;
    if (!keyword) {
      set.status = 400;
      return { error: "keyword parameter is required" };
    }
    const authors = db
      .query(
        "SELECT id, name, bio FROM authors WHERE LOWER(name) LIKE '%' || LOWER(?) || '%' OR LOWER(bio) LIKE '%' || LOWER(?) || '%'"
      )
      .all(keyword, keyword);
    const books = db
      .query(
        "SELECT id, title, author_id AS authorId, genre, year, description FROM books WHERE LOWER(title) LIKE '%' || LOWER(?) || '%' OR LOWER(genre) LIKE '%' || LOWER(?) || '%' OR LOWER(description) LIKE '%' || LOWER(?) || '%'"
      )
      .all(keyword, keyword, keyword);
    return { authors, books };
  })
  .get("/api/stats", () => {
    const totalAuthors = (db.query("SELECT COUNT(*) AS count FROM authors").get() as any).count;
    const totalBooks = (db.query("SELECT COUNT(*) AS count FROM books").get() as any).count;
    const years = db.query("SELECT MIN(year) AS min, MAX(year) AS max, AVG(year) AS avg FROM books").get() as any;
    const genreRows = db.query("SELECT genre, COUNT(*) AS count FROM books GROUP BY genre").all() as any[];
    const authorRows = db.query("SELECT a.name, COUNT(b.id) AS count FROM authors a JOIN books b ON a.id = b.author_id GROUP BY a.id, a.name").all() as any[];

    const booksByGenre: Record<string, number> = {};
    genreRows.forEach(r => booksByGenre[r.genre] = r.count);

    const authorsByBookCount: Record<string, number> = {};
    authorRows.forEach(r => authorsByBookCount[r.name] = r.count);

    return {
      totalAuthors,
      totalBooks,
      earliestYear: years.min,
      latestYear: years.max,
      averageYear: Math.round(years.avg * 100) / 100,
      booksByGenre,
      authorsByBookCount
    };
  })
  .listen(8080);

console.log(`Book API (Elysia) running on port 8080`);
