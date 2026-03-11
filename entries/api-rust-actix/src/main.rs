use actix_web::{web, App, HttpServer, HttpResponse};
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;

#[derive(Serialize)]
struct Author {
    id: i64,
    name: String,
    bio: String,
}

#[derive(Serialize)]
struct Book {
    id: i64,
    title: String,
    #[serde(rename = "authorId")]
    author_id: i64,
    genre: String,
    year: i64,
    description: String,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
}

#[derive(Serialize)]
struct SearchResult {
    authors: Vec<Author>,
    books: Vec<Book>,
}

#[derive(Deserialize)]
struct KeywordQuery {
    keyword: Option<String>,
}

#[derive(Deserialize)]
struct BooksQuery {
    keyword: Option<String>,
    page: Option<i64>,
    limit: Option<i64>,
}

#[derive(Serialize)]
struct PaginatedBooks {
    data: Vec<Book>,
    page: i64,
    limit: i64,
    #[serde(rename = "totalItems")]
    total_items: i64,
    #[serde(rename = "totalPages")]
    total_pages: i64,
}

#[derive(Deserialize)]
struct NewBook {
    title: Option<String>,
    #[serde(rename = "authorId")]
    author_id: Option<i64>,
    genre: Option<String>,
    year: Option<i64>,
    description: Option<String>,
}

#[derive(Serialize)]
struct Stats {
    #[serde(rename = "totalAuthors")]
    total_authors: i64,
    #[serde(rename = "totalBooks")]
    total_books: i64,
    #[serde(rename = "earliestYear")]
    earliest_year: i64,
    #[serde(rename = "latestYear")]
    latest_year: i64,
    #[serde(rename = "averageYear")]
    average_year: f64,
    #[serde(rename = "booksByGenre")]
    books_by_genre: HashMap<String, i64>,
    #[serde(rename = "authorsByBookCount")]
    authors_by_book_count: HashMap<String, i64>,
}

struct AppState {
    db: Mutex<Connection>,
}

async fn get_authors(data: web::Data<AppState>, query: web::Query<KeywordQuery>) -> HttpResponse {
    let conn = data.db.lock().unwrap();

    if let Some(ref keyword) = query.keyword {
        let pattern = format!("%{}%", keyword.to_lowercase());
        let mut stmt = conn
            .prepare("SELECT id, name, bio FROM authors WHERE LOWER(name) LIKE ?1 OR LOWER(bio) LIKE ?1 ORDER BY id")
            .unwrap();
        let authors: Vec<Author> = stmt
            .query_map([&pattern], |row| {
                Ok(Author {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    bio: row.get(2)?,
                })
            })
            .unwrap()
            .filter_map(|r| r.ok())
            .collect();
        HttpResponse::Ok().json(authors)
    } else {
        let mut stmt = conn.prepare("SELECT id, name, bio FROM authors ORDER BY id").unwrap();
        let authors: Vec<Author> = stmt
            .query_map([], |row| {
                Ok(Author {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    bio: row.get(2)?,
                })
            })
            .unwrap()
            .filter_map(|r| r.ok())
            .collect();
        HttpResponse::Ok().json(authors)
    }
}

async fn get_author_by_id(data: web::Data<AppState>, path: web::Path<i64>) -> HttpResponse {
    let id = path.into_inner();
    let conn = data.db.lock().unwrap();
    let mut stmt = conn.prepare("SELECT id, name, bio FROM authors WHERE id = ?1").unwrap();
    let author = stmt
        .query_row([id], |row| {
            Ok(Author {
                id: row.get(0)?,
                name: row.get(1)?,
                bio: row.get(2)?,
            })
        });

    match author {
        Ok(a) => HttpResponse::Ok().json(a),
        Err(_) => HttpResponse::NotFound().json(ErrorResponse {
            error: "Author not found".to_string(),
        }),
    }
}

async fn get_author_books(data: web::Data<AppState>, path: web::Path<i64>) -> HttpResponse {
    let author_id = path.into_inner();
    let conn = data.db.lock().unwrap();

    // Check if author exists
    let author_exists: bool = conn
        .query_row("SELECT COUNT(*) FROM authors WHERE id = ?1", [author_id], |row| {
            row.get::<_, i64>(0)
        })
        .map(|count| count > 0)
        .unwrap_or(false);

    if !author_exists {
        return HttpResponse::NotFound().json(ErrorResponse {
            error: "Author not found".to_string(),
        });
    }

    let mut stmt = conn
        .prepare("SELECT id, title, author_id, genre, year, description FROM books WHERE author_id = ?1 ORDER BY id")
        .unwrap();
    let books: Vec<Book> = stmt
        .query_map([author_id], |row| {
            Ok(Book {
                id: row.get(0)?,
                title: row.get(1)?,
                author_id: row.get(2)?,
                genre: row.get(3)?,
                year: row.get(4)?,
                description: row.get(5)?,
            })
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect();

    HttpResponse::Ok().json(books)
}

async fn get_books(data: web::Data<AppState>, query: web::Query<BooksQuery>) -> HttpResponse {
    let conn = data.db.lock().unwrap();

    if let Some(ref keyword) = query.keyword {
        let pattern = format!("%{}%", keyword.to_lowercase());
        let mut stmt = conn
            .prepare("SELECT id, title, author_id, genre, year, description FROM books WHERE LOWER(title) LIKE ?1 OR LOWER(genre) LIKE ?1 OR LOWER(description) LIKE ?1 ORDER BY id")
            .unwrap();
        let books: Vec<Book> = stmt
            .query_map([&pattern], |row| {
                Ok(Book {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    author_id: row.get(2)?,
                    genre: row.get(3)?,
                    year: row.get(4)?,
                    description: row.get(5)?,
                })
            })
            .unwrap()
            .filter_map(|r| r.ok())
            .collect();
        HttpResponse::Ok().json(books)
    } else {
        let page = query.page.unwrap_or(1).max(1);
        let limit = query.limit.unwrap_or(20).max(1);
        let offset = (page - 1) * limit;

        let total_items: i64 = conn
            .query_row("SELECT COUNT(*) FROM books", [], |row| row.get(0))
            .unwrap();

        let total_pages = if total_items == 0 { 0 } else { (total_items + limit - 1) / limit };

        let mut stmt = conn
            .prepare("SELECT id, title, author_id, genre, year, description FROM books ORDER BY id LIMIT ?1 OFFSET ?2")
            .unwrap();
        let books: Vec<Book> = stmt
            .query_map(rusqlite::params![limit, offset], |row| {
                Ok(Book {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    author_id: row.get(2)?,
                    genre: row.get(3)?,
                    year: row.get(4)?,
                    description: row.get(5)?,
                })
            })
            .unwrap()
            .filter_map(|r| r.ok())
            .collect();

        HttpResponse::Ok().json(PaginatedBooks {
            data: books,
            page,
            limit,
            total_items: total_items,
            total_pages,
        })
    }
}

async fn get_book_by_id(data: web::Data<AppState>, path: web::Path<i64>) -> HttpResponse {
    let id = path.into_inner();
    let conn = data.db.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT id, title, author_id, genre, year, description FROM books WHERE id = ?1")
        .unwrap();
    let book = stmt.query_row([id], |row| {
        Ok(Book {
            id: row.get(0)?,
            title: row.get(1)?,
            author_id: row.get(2)?,
            genre: row.get(3)?,
            year: row.get(4)?,
            description: row.get(5)?,
        })
    });

    match book {
        Ok(b) => HttpResponse::Ok().json(b),
        Err(_) => HttpResponse::NotFound().json(ErrorResponse {
            error: "Book not found".to_string(),
        }),
    }
}

async fn search(data: web::Data<AppState>, query: web::Query<KeywordQuery>) -> HttpResponse {
    let keyword = match &query.keyword {
        Some(k) if !k.is_empty() => k.clone(),
        _ => {
            return HttpResponse::BadRequest().json(ErrorResponse {
                error: "keyword parameter is required".to_string(),
            });
        }
    };

    let conn = data.db.lock().unwrap();
    let pattern = format!("%{}%", keyword.to_lowercase());

    let mut author_stmt = conn
        .prepare("SELECT id, name, bio FROM authors WHERE LOWER(name) LIKE ?1 OR LOWER(bio) LIKE ?1 ORDER BY id")
        .unwrap();
    let authors: Vec<Author> = author_stmt
        .query_map([&pattern], |row| {
            Ok(Author {
                id: row.get(0)?,
                name: row.get(1)?,
                bio: row.get(2)?,
            })
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect();

    let mut book_stmt = conn
        .prepare("SELECT id, title, author_id, genre, year, description FROM books WHERE LOWER(title) LIKE ?1 OR LOWER(genre) LIKE ?1 OR LOWER(description) LIKE ?1 ORDER BY id")
        .unwrap();
    let books: Vec<Book> = book_stmt
        .query_map([&pattern], |row| {
            Ok(Book {
                id: row.get(0)?,
                title: row.get(1)?,
                author_id: row.get(2)?,
                genre: row.get(3)?,
                year: row.get(4)?,
                description: row.get(5)?,
            })
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect();

    HttpResponse::Ok().json(SearchResult { authors, books })
}

async fn create_book(data: web::Data<AppState>, body: web::Json<NewBook>) -> HttpResponse {
    let title = match &body.title {
        Some(t) if !t.is_empty() => t.clone(),
        _ => return HttpResponse::BadRequest().json(ErrorResponse { error: "title is required".to_string() }),
    };
    let author_id = match body.author_id {
        Some(id) => id,
        None => return HttpResponse::BadRequest().json(ErrorResponse { error: "authorId is required".to_string() }),
    };
    let genre = match &body.genre {
        Some(g) if !g.is_empty() => g.clone(),
        _ => return HttpResponse::BadRequest().json(ErrorResponse { error: "genre is required".to_string() }),
    };
    let year = match body.year {
        Some(y) => y,
        None => return HttpResponse::BadRequest().json(ErrorResponse { error: "year is required".to_string() }),
    };
    let description = match &body.description {
        Some(d) if !d.is_empty() => d.clone(),
        _ => return HttpResponse::BadRequest().json(ErrorResponse { error: "description is required".to_string() }),
    };

    let conn = data.db.lock().unwrap();

    // Validate authorId exists
    let author_exists: bool = conn
        .query_row("SELECT COUNT(*) FROM authors WHERE id = ?1", [author_id], |row| row.get::<_, i64>(0))
        .map(|count| count > 0)
        .unwrap_or(false);

    if !author_exists {
        return HttpResponse::BadRequest().json(ErrorResponse { error: "Invalid authorId".to_string() });
    }

    // Validate year range
    if year < 1000 || year > 9999 {
        return HttpResponse::BadRequest().json(ErrorResponse { error: "year must be between 1000 and 9999".to_string() });
    }

    conn.execute(
        "INSERT INTO books (title, author_id, genre, year, description) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![title, author_id, genre, year, description],
    ).unwrap();
    let id = conn.last_insert_rowid();

    HttpResponse::Created().json(Book { id, title, author_id, genre, year, description })
}

async fn get_stats(data: web::Data<AppState>) -> HttpResponse {
    let conn = data.db.lock().unwrap();

    let total_authors: i64 = conn
        .query_row("SELECT COUNT(*) FROM authors", [], |row| row.get(0))
        .unwrap();

    let total_books: i64 = conn
        .query_row("SELECT COUNT(*) FROM books", [], |row| row.get(0))
        .unwrap();

    let (earliest_year, latest_year, avg_year): (i64, i64, f64) = conn
        .query_row("SELECT MIN(year), MAX(year), AVG(year) FROM books", [], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        })
        .unwrap();

    let average_year = (avg_year * 100.0).round() / 100.0;

    let mut books_by_genre = HashMap::new();
    let mut stmt = conn.prepare("SELECT genre, COUNT(*) FROM books GROUP BY genre").unwrap();
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
    }).unwrap();
    for row in rows {
        let (genre, count) = row.unwrap();
        books_by_genre.insert(genre, count);
    }

    let mut authors_by_book_count = HashMap::new();
    let mut stmt = conn.prepare("SELECT a.name, COUNT(b.id) FROM authors a JOIN books b ON a.id = b.author_id GROUP BY a.id, a.name").unwrap();
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
    }).unwrap();
    for row in rows {
        let (name, count) = row.unwrap();
        authors_by_book_count.insert(name, count);
    }

    HttpResponse::Ok().json(Stats {
        total_authors,
        total_books,
        earliest_year,
        latest_year,
        average_year,
        books_by_genre,
        authors_by_book_count,
    })
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let db_path = std::env::var("DB_PATH").unwrap_or_else(|_| "/app/books.db".to_string());
    let conn = Connection::open(&db_path).expect("Failed to open database");
    conn.execute_batch("PRAGMA journal_mode=WAL;").ok();

    let data = web::Data::new(AppState {
        db: Mutex::new(conn),
    });

    println!("Starting server on port 8080 with database: {}", db_path);

    HttpServer::new(move || {
        App::new()
            .app_data(data.clone())
            .route("/api/authors", web::get().to(get_authors))
            .route("/api/authors/{id}/books", web::get().to(get_author_books))
            .route("/api/authors/{id}", web::get().to(get_author_by_id))
            .route("/api/books", web::get().to(get_books))
            .route("/api/books", web::post().to(create_book))
            .route("/api/books/{id}", web::get().to(get_book_by_id))
            .route("/api/search", web::get().to(search))
            .route("/api/stats", web::get().to(get_stats))
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}
