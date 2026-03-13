# Book API Tournament -- API Specification

This document is the **single source of truth** for the Book API contract. All implementations must conform to this spec. The validator (`validate/validator.py`) tests against this spec.

---

## 1. Overview

- RESTful JSON API for managing books and authors
- Base path: `/api`
- Content-Type: always `application/json` (responses and error responses)
- All JSON keys use **camelCase** (e.g., `authorId`, not `author_id`)
- Error responses always use the shape `{"error": "message"}`

---

## 2. Data Model

### Author

| Field | Type    | Description          |
|-------|---------|----------------------|
| id    | integer | Unique identifier    |
| name  | string  | Author's full name   |
| bio   | string  | Short biography      |

### Book

| Field       | Type    | Description                        |
|-------------|---------|------------------------------------|
| id          | integer | Unique identifier                  |
| title       | string  | Book title                         |
| authorId    | integer | Foreign key to author              |
| genre       | string  | Genre label                        |
| year        | integer | Publication year                   |
| description | string  | Brief description of the book      |

**Note:** The SQL column is `author_id`, but the JSON key is `authorId`. Implementations must map between the two.

---

## 3. Endpoints

Every entry implements all 8 endpoints described below, backed by SQLite.

### 3.1 Base Endpoints

#### GET /api/authors

Returns all authors as a flat JSON array.

**Response:** `200 OK`
```json
[
  {"id": 1, "name": "Octavia Butler", "bio": "American science fiction author..."},
  {"id": 2, "name": "Toni Morrison", "bio": "Nobel Prize-winning novelist..."}
]
```

#### GET /api/authors/{id}

Returns a single author by ID.

**Response:** `200 OK`
```json
{"id": 1, "name": "Octavia Butler", "bio": "American science fiction author..."}
```

**Error:** `404 Not Found`
```json
{"error": "Author not found"}
```

#### GET /api/books

Returns all books as a **paginated response object** (see section 3.3).

**Response:** `200 OK`
```json
[
  {"id": 1, "title": "Kindred", "authorId": 1, "genre": "Science Fiction", "year": 1979, "description": "A modern..."},
  {"id": 2, "title": "Parable of the Sower", "authorId": 1, "genre": "Science Fiction", "year": 1993, "description": "In a..."}
]
```

#### GET /api/books/{id}

Returns a single book by ID.

**Response:** `200 OK`
```json
{"id": 1, "title": "Kindred", "authorId": 1, "genre": "Science Fiction", "year": 1979, "description": "A modern..."}
```

**Error:** `404 Not Found`
```json
{"error": "Book not found"}
```

---

### 3.2 Filtering and Search Endpoints

#### GET /api/authors?keyword=X

Filters authors by keyword. Case-insensitive substring match on `name` and `bio` fields only. The `id` field is never searched.

- Without the `keyword` query parameter, returns all authors (same as base `GET /api/authors`).
- Non-matching keyword returns `200` with an empty array, **not** 404.

**Response:** `200 OK`
```json
[
  {"id": 1, "name": "Octavia Butler", "bio": "American science fiction author..."}
]
```

#### GET /api/books?keyword=X

Filters books by keyword. Case-insensitive substring match on `title`, `genre`, and `description` fields only. The `year` and `id` fields are **never** searched.

- Without the `keyword` query parameter: returns all books (paginated response).
- With keyword: always returns a **flat array** (no pagination wrapper).
- Non-matching keyword returns `200` with an empty array, **not** 404.

**Response:** `200 OK`
```json
[
  {"id": 5, "title": "The Fifth Season", "authorId": 3, "genre": "Fantasy", "year": 2015, "description": "..."}
]
```

#### GET /api/authors/{id}/books

Returns all books by a specific author.

**Response:** `200 OK`
```json
[
  {"id": 1, "title": "Kindred", "authorId": 1, "genre": "Science Fiction", "year": 1979, "description": "..."},
  {"id": 2, "title": "Parable of the Sower", "authorId": 1, "genre": "Science Fiction", "year": 1993, "description": "..."}
]
```

**Error (author does not exist):** `404 Not Found`
```json
{"error": "Author not found"}
```

**Note:** If the author exists but has no books, return `200` with an empty array.

#### GET /api/search?keyword=X

Combined search across both authors and books. Returns an object with two arrays.

- Authors are searched on `name` and `bio` (case-insensitive substring).
- Books are searched on `title`, `genre`, and `description` (case-insensitive substring).
- The `keyword` query parameter is **required**. If missing, return 400.

**Response:** `200 OK`
```json
{
  "authors": [
    {"id": 1, "name": "Octavia Butler", "bio": "American science fiction author..."}
  ],
  "books": [
    {"id": 1, "title": "Kindred", "authorId": 1, "genre": "Science Fiction", "year": 1979, "description": "..."}
  ]
}
```

**Error (missing keyword):** `400 Bad Request`
```json
{"error": "keyword parameter is required"}
```

---

### 3.3 Write, Stats, and Pagination Endpoints

#### GET /api/books (paginated, without keyword)

`GET /api/books` without a `keyword` parameter returns a **paginated response object**.

**Query parameters:**
- `page` -- Page number (default: `1`)
- `limit` -- Items per page (default: `20`)

**Response:** `200 OK`
```json
{
  "data": [
    {"id": 1, "title": "Kindred", "authorId": 1, "genre": "Science Fiction", "year": 1979, "description": "..."}
  ],
  "page": 1,
  "limit": 20,
  "totalItems": 16,
  "totalPages": 1
}
```

**Behavior:**
- `totalPages` is calculated as `ceil(totalItems / limit)`.
- If `page` exceeds the last page, return `200` with an empty `data` array (not 404). The `page`, `limit`, `totalItems`, and `totalPages` fields are still populated correctly.
- `GET /api/books?keyword=X` still returns a **flat array** (no pagination wrapper).

#### POST /api/books

Creates a new book.

**Request body:**
```json
{
  "title": "New Book",
  "authorId": 1,
  "genre": "Fantasy",
  "year": 2024,
  "description": "A new book."
}
```

**All five fields are required.** Validation rules:
- All fields must be present and non-empty.
- `authorId` must reference an existing author.
- `year` must be an integer between 1000 and 9999 (inclusive).

**Success:** `201 Created`
```json
{"id": 17, "title": "New Book", "authorId": 1, "genre": "Fantasy", "year": 2024, "description": "A new book."}
```

The response includes the server-generated `id`. The book must be persisted and visible in subsequent GET requests.

**Validation failure:** `400 Bad Request`
```json
{"error": "title is required"}
```

The error message should describe the specific validation failure.

#### GET /api/stats

Returns aggregate statistics computed from the current data.

**Response:** `200 OK`
```json
{
  "totalAuthors": 8,
  "totalBooks": 16,
  "earliestYear": 1953,
  "latestYear": 2020,
  "averageYear": 1987.25,
  "booksByGenre": {
    "Fantasy": 4,
    "Literary Fiction": 6,
    "Science Fiction": 3,
    "Urban Fantasy": 1,
    "Historical Fiction": 1,
    "Magical Realism": 1
  },
  "authorsByBookCount": {
    "Octavia Butler": 2,
    "Toni Morrison": 2,
    "N.K. Jemisin": 2,
    "James Baldwin": 2,
    "Ursula K. Le Guin": 2,
    "Haruki Murakami": 2,
    "Chimamanda Ngozi Adichie": 2,
    "Terry Pratchett": 2
  }
}
```

**Field details:**
- `totalAuthors` -- Count of all authors.
- `totalBooks` -- Count of all books.
- `earliestYear` -- Minimum `year` value across all books.
- `latestYear` -- Maximum `year` value across all books.
- `averageYear` -- Mean of all book `year` values, rounded to 2 decimal places.
- `booksByGenre` -- Object mapping each genre string to the count of books in that genre.
- `authorsByBookCount` -- Object mapping each author name to the count of books by that author.

---

## 4. Error Handling

All error responses use `application/json` Content-Type and the following shape:

```json
{"error": "Human-readable error message"}
```

| Situation                              | Status | Example error message              |
|----------------------------------------|--------|------------------------------------|
| Author not found by ID                 | 404    | `"Author not found"`               |
| Book not found by ID                   | 404    | `"Book not found"`                 |
| Missing keyword on /api/search         | 400    | `"keyword parameter is required"`  |
| POST /api/books missing required field | 400    | `"title is required"`              |
| POST /api/books invalid authorId       | 400    | `"Invalid authorId"`               |
| POST /api/books year out of range      | 400    | `"year must be between 1000 and 9999"` |

Error messages do not need to match these examples exactly, but the status codes and response shape must match.

---

## 5. Filtering Rules

Filtering applies to endpoints that accept a `keyword` query parameter.

1. **Case-insensitive substring matching.** The keyword `"butler"` matches `"Octavia Butler"`.
2. **Fields searched per endpoint:**
   - `GET /api/authors?keyword=` -- `name`, `bio`
   - `GET /api/books?keyword=` -- `title`, `genre`, `description`
   - `GET /api/search?keyword=` -- Authors: `name`, `bio`. Books: `title`, `genre`, `description`.
3. **Fields never searched:** `id`, `year`, `authorId`. A keyword of `"1987"` must not match a book with `year: 1987` (unless `"1987"` appears in the title, genre, or description).
4. **Empty results return 200 with an empty array**, not 404.
5. **Without a keyword parameter**, the endpoint returns all items (no filtering applied).

---

## 6. Database Configuration

- **Engine:** SQLite
- **Path:** Configured via the `DB_PATH` environment variable. Default: `/app/books.db`.
- **Initialization:** The database is created from `db/schema.sql` followed by `db/seed-{size}.sql` during Docker image build.
- **Data sizes:** `small` (8 authors, 16 books), `medium` (100 authors, 1,000 books), `large` (500 authors, 50,000 books). The data size is selected at benchmark time by the operator; the default for validation is `small`.
- **Column mapping:** The SQL schema uses `author_id`; JSON responses must use `authorId`.
