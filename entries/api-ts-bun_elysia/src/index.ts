import { Elysia } from "elysia";
import { Database } from "bun:sqlite";

const dbPath = Bun.env.DB_PATH ?? "/app/books.db";
const db = new Database(dbPath, { readonly: true });

const app = new Elysia()
  .get("/api/authors", () => {
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
  .get("/api/books", () => {
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
  .listen(8080);

console.log(`Book API (Elysia) running on port 8080`);
