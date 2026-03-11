import { Elysia } from "elysia";
import { Database } from "bun:sqlite";

const dbPath = Bun.env.DB_PATH ?? "/app/books.db";
const db = new Database(dbPath, { readonly: true });

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
    return db
      .query("SELECT id, title, author_id AS authorId, genre, year, description FROM books")
      .all();
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
  .listen(8080);

console.log(`Book API (Elysia) running on port 8080`);
