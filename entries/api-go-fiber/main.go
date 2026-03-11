package main

import (
	"database/sql"
	"log"
	"math"
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

type CreateBookRequest struct {
	Title       string `json:"title"`
	AuthorID    int    `json:"authorId"`
	Genre       string `json:"genre"`
	Year        int    `json:"year"`
	Description string `json:"description"`
}

type PaginatedBooks struct {
	Data       []Book `json:"data"`
	Page       int    `json:"page"`
	Limit      int    `json:"limit"`
	TotalItems int    `json:"totalItems"`
	TotalPages int    `json:"totalPages"`
}

type Stats struct {
	TotalAuthors       int            `json:"totalAuthors"`
	TotalBooks         int            `json:"totalBooks"`
	EarliestYear       int            `json:"earliestYear"`
	LatestYear         int            `json:"latestYear"`
	AverageYear        float64        `json:"averageYear"`
	BooksByGenre       map[string]int `json:"booksByGenre"`
	AuthorsByBookCount map[string]int `json:"authorsByBookCount"`
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
	app.Get("/api/authors/:id/books", getAuthorBooks)
	app.Get("/api/authors/:id", getAuthor)
	app.Post("/api/books", createBook)
	app.Get("/api/books", getBooks)
	app.Get("/api/books/:id", getBook)
	app.Get("/api/search", search)
	app.Get("/api/stats", getStats)

	log.Println("Server starting on :8080")
	log.Fatal(app.Listen(":8080"))
}

func getAuthors(c *fiber.Ctx) error {
	keyword := c.Query("keyword")
	var rows *sql.Rows
	var err error
	if keyword != "" {
		rows, err = db.Query(
			"SELECT id, name, bio FROM authors WHERE LOWER(name) LIKE '%' || LOWER(?) || '%' OR LOWER(bio) LIKE '%' || LOWER(?) || '%' ORDER BY id",
			keyword, keyword,
		)
	} else {
		rows, err = db.Query("SELECT id, name, bio FROM authors ORDER BY id")
	}
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
	keyword := c.Query("keyword")

	if keyword != "" {
		rows, err := db.Query(
			"SELECT id, title, author_id, genre, year, description FROM books WHERE LOWER(title) LIKE '%' || LOWER(?) || '%' OR LOWER(genre) LIKE '%' || LOWER(?) || '%' OR LOWER(description) LIKE '%' || LOWER(?) || '%' ORDER BY id",
			keyword, keyword, keyword,
		)
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

	// Paginated response when no keyword
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 20)
	offset := (page - 1) * limit

	var totalItems int
	if err := db.QueryRow("SELECT COUNT(*) FROM books").Scan(&totalItems); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "Database error"})
	}
	totalPages := (totalItems + limit - 1) / limit

	rows, err := db.Query("SELECT id, title, author_id, genre, year, description FROM books ORDER BY id LIMIT ? OFFSET ?", limit, offset)
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

	return c.JSON(PaginatedBooks{
		Data:       books,
		Page:       page,
		Limit:      limit,
		TotalItems: totalItems,
		TotalPages: totalPages,
	})
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

func getAuthorBooks(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(404).JSON(ErrorResponse{Error: "Author not found"})
	}

	// Check author exists
	var exists int
	err = db.QueryRow("SELECT id FROM authors WHERE id = ?", id).Scan(&exists)
	if err == sql.ErrNoRows {
		return c.Status(404).JSON(ErrorResponse{Error: "Author not found"})
	}
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "Database error"})
	}

	rows, err := db.Query("SELECT id, title, author_id, genre, year, description FROM books WHERE author_id = ? ORDER BY id", id)
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

func search(c *fiber.Ctx) error {
	keyword := c.Query("keyword")
	if keyword == "" {
		return c.Status(400).JSON(ErrorResponse{Error: "keyword parameter is required"})
	}

	// Search authors
	authorRows, err := db.Query(
		"SELECT id, name, bio FROM authors WHERE LOWER(name) LIKE '%' || LOWER(?) || '%' OR LOWER(bio) LIKE '%' || LOWER(?) || '%' ORDER BY id",
		keyword, keyword,
	)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "Database error"})
	}
	defer authorRows.Close()

	authors := make([]Author, 0)
	for authorRows.Next() {
		var a Author
		if err := authorRows.Scan(&a.ID, &a.Name, &a.Bio); err != nil {
			return c.Status(500).JSON(ErrorResponse{Error: "Database error"})
		}
		authors = append(authors, a)
	}

	// Search books
	bookRows, err := db.Query(
		"SELECT id, title, author_id, genre, year, description FROM books WHERE LOWER(title) LIKE '%' || LOWER(?) || '%' OR LOWER(genre) LIKE '%' || LOWER(?) || '%' OR LOWER(description) LIKE '%' || LOWER(?) || '%' ORDER BY id",
		keyword, keyword, keyword,
	)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "Database error"})
	}
	defer bookRows.Close()

	books := make([]Book, 0)
	for bookRows.Next() {
		var b Book
		if err := bookRows.Scan(&b.ID, &b.Title, &b.AuthorID, &b.Genre, &b.Year, &b.Description); err != nil {
			return c.Status(500).JSON(ErrorResponse{Error: "Database error"})
		}
		books = append(books, b)
	}

	return c.JSON(fiber.Map{
		"authors": authors,
		"books":   books,
	})
}

func createBook(c *fiber.Ctx) error {
	var req CreateBookRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "Invalid request body"})
	}

	if req.Title == "" {
		return c.Status(400).JSON(ErrorResponse{Error: "title is required"})
	}
	if req.Genre == "" {
		return c.Status(400).JSON(ErrorResponse{Error: "genre is required"})
	}
	if req.Description == "" {
		return c.Status(400).JSON(ErrorResponse{Error: "description is required"})
	}
	if req.AuthorID == 0 {
		return c.Status(400).JSON(ErrorResponse{Error: "authorId is required"})
	}
	if req.Year == 0 {
		return c.Status(400).JSON(ErrorResponse{Error: "year is required"})
	}
	if req.Year < 1000 || req.Year > 9999 {
		return c.Status(400).JSON(ErrorResponse{Error: "year must be between 1000 and 9999"})
	}

	// Check author exists
	var exists int
	err := db.QueryRow("SELECT id FROM authors WHERE id = ?", req.AuthorID).Scan(&exists)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "authorId must reference an existing author"})
	}

	result, err := db.Exec(
		"INSERT INTO books (title, author_id, genre, year, description) VALUES (?, ?, ?, ?, ?)",
		req.Title, req.AuthorID, req.Genre, req.Year, req.Description,
	)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "Database error"})
	}

	id, err := result.LastInsertId()
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "Database error"})
	}

	book := Book{
		ID:          int(id),
		Title:       req.Title,
		AuthorID:    req.AuthorID,
		Genre:       req.Genre,
		Year:        req.Year,
		Description: req.Description,
	}

	return c.Status(201).JSON(book)
}

func getStats(c *fiber.Ctx) error {
	var stats Stats

	if err := db.QueryRow("SELECT COUNT(*) FROM authors").Scan(&stats.TotalAuthors); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "Database error"})
	}
	if err := db.QueryRow("SELECT COUNT(*) FROM books").Scan(&stats.TotalBooks); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "Database error"})
	}

	var avg float64
	if err := db.QueryRow("SELECT MIN(year), MAX(year), AVG(year) FROM books").Scan(&stats.EarliestYear, &stats.LatestYear, &avg); err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "Database error"})
	}
	stats.AverageYear = math.Round(avg*100) / 100

	// Books by genre
	stats.BooksByGenre = make(map[string]int)
	genreRows, err := db.Query("SELECT genre, COUNT(*) FROM books GROUP BY genre")
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "Database error"})
	}
	defer genreRows.Close()
	for genreRows.Next() {
		var genre string
		var count int
		if err := genreRows.Scan(&genre, &count); err != nil {
			return c.Status(500).JSON(ErrorResponse{Error: "Database error"})
		}
		stats.BooksByGenre[genre] = count
	}

	// Authors by book count
	stats.AuthorsByBookCount = make(map[string]int)
	authorRows, err := db.Query("SELECT a.name, COUNT(b.id) FROM authors a JOIN books b ON a.id = b.author_id GROUP BY a.id, a.name")
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "Database error"})
	}
	defer authorRows.Close()
	for authorRows.Next() {
		var name string
		var count int
		if err := authorRows.Scan(&name, &count); err != nil {
			return c.Status(500).JSON(ErrorResponse{Error: "Database error"})
		}
		stats.AuthorsByBookCount[name] = count
	}

	return c.JSON(stats)
}
