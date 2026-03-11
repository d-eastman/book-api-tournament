use actix_web::{web, App, HttpServer, HttpResponse};
use rusqlite::Connection;
use serde::Serialize;
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

struct AppState {
    db: Mutex<Connection>,
}

async fn get_authors(data: web::Data<AppState>) -> HttpResponse {
    let conn = data.db.lock().unwrap();
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

async fn get_books(data: web::Data<AppState>) -> HttpResponse {
    let conn = data.db.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT id, title, author_id, genre, year, description FROM books ORDER BY id")
        .unwrap();
    let books: Vec<Book> = stmt
        .query_map([], |row| {
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
            .route("/api/authors/{id}", web::get().to(get_author_by_id))
            .route("/api/books", web::get().to(get_books))
            .route("/api/books/{id}", web::get().to(get_book_by_id))
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}
