package main

import (
	"database/sql"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	_ "github.com/mattn/go-sqlite3"
)

type Author struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
	Bio  string `json:"bio"`
}

type Book struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	AuthorID    int    `json:"authorId"`
	Genre       string `json:"genre"`
	Year        int    `json:"year"`
	Description string `json:"description"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

var db *sql.DB

func main() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "/app/books.db"
	}

	var err error
	db, err = sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	app := fiber.New(fiber.Config{
		DisableStartupMessage: true,
	})

	app.Get("/api/authors", getAuthors)
	app.Get("/api/authors/:id", getAuthor)
	app.Get("/api/books", getBooks)
	app.Get("/api/books/:id", getBook)

	log.Println("Server starting on :8080")
	log.Fatal(app.Listen(":8080"))
}

func getAuthors(c *fiber.Ctx) error {
	rows, err := db.Query("SELECT id, name, bio FROM authors ORDER BY id")
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "Database error"})
	}
	defer rows.Close()

	authors := make([]Author, 0)
	for rows.Next() {
		var a Author
		if err := rows.Scan(&a.ID, &a.Name, &a.Bio); err != nil {
			return c.Status(500).JSON(ErrorResponse{Error: "Database error"})
		}
		authors = append(authors, a)
	}
	return c.JSON(authors)
}

func getAuthor(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(404).JSON(ErrorResponse{Error: "Author not found"})
	}

	var a Author
	err = db.QueryRow("SELECT id, name, bio FROM authors WHERE id = ?", id).Scan(&a.ID, &a.Name, &a.Bio)
	if err == sql.ErrNoRows {
		return c.Status(404).JSON(ErrorResponse{Error: "Author not found"})
	}
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "Database error"})
	}
	return c.JSON(a)
}

func getBooks(c *fiber.Ctx) error {
	rows, err := db.Query("SELECT id, title, author_id, genre, year, description FROM books ORDER BY id")
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "Database error"})
	}
	defer rows.Close()

	books := make([]Book, 0)
	for rows.Next() {
		var b Book
		if err := rows.Scan(&b.ID, &b.Title, &b.AuthorID, &b.Genre, &b.Year, &b.Description); err != nil {
			return c.Status(500).JSON(ErrorResponse{Error: "Database error"})
		}
		books = append(books, b)
	}
	return c.JSON(books)
}

func getBook(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(404).JSON(ErrorResponse{Error: "Book not found"})
	}

	var b Book
	err = db.QueryRow("SELECT id, title, author_id, genre, year, description FROM books WHERE id = ?", id).
		Scan(&b.ID, &b.Title, &b.AuthorID, &b.Genre, &b.Year, &b.Description)
	if err == sql.ErrNoRows {
		return c.Status(404).JSON(ErrorResponse{Error: "Book not found"})
	}
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "Database error"})
	}
	return c.JSON(b)
}
