#!/usr/bin/env python3
"""
Book API Tournament — Validator
Zero-dependency correctness test suite for API entries.

Usage:
    python3 validator.py <base-url> [--level hardcoded|v1|v2|v3] [--detect] [--verbose]
"""

import sys
import json
import argparse
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from urllib.parse import quote

# ─── Expected Data ───────────────────────────────────────────────────────────

HARDCODED_AUTHORS = [
    {"id": 1, "name": "Octavia Butler", "bio": "American science fiction author known for blending African American spirituality with science fiction."},
    {"id": 2, "name": "Toni Morrison", "bio": "Nobel Prize-winning novelist celebrated for her powerful exploration of Black identity and American history."},
    {"id": 3, "name": "N.K. Jemisin", "bio": "First author to win the Hugo Award for Best Novel three years in a row for the Broken Earth trilogy."},
    {"id": 4, "name": "James Baldwin", "bio": "Essayist and novelist whose works explored racial and social issues in America."},
]

SMALL_AUTHORS = HARDCODED_AUTHORS + [
    {"id": 5, "name": "Ursula K. Le Guin", "bio": "American author best known for science fiction and fantasy works exploring gender, society, and political structures."},
    {"id": 6, "name": "Haruki Murakami", "bio": "Japanese novelist known for surreal and dreamlike narratives blending the mundane with the fantastical."},
    {"id": 7, "name": "Chimamanda Ngozi Adichie", "bio": "Nigerian author celebrated for her novels and essays exploring identity, feminism, and the immigrant experience."},
    {"id": 8, "name": "Terry Pratchett", "bio": "British author best known for the Discworld series, a satirical fantasy series spanning over 40 novels."},
]

HARDCODED_BOOKS = [
    {"id": 1, "title": "Kindred", "authorId": 1, "genre": "Science Fiction", "year": 1979},
    {"id": 2, "title": "Parable of the Sower", "authorId": 1, "genre": "Science Fiction", "year": 1993},
    {"id": 3, "title": "Beloved", "authorId": 2, "genre": "Literary Fiction", "year": 1987},
    {"id": 4, "title": "Song of Solomon", "authorId": 2, "genre": "Literary Fiction", "year": 1977},
    {"id": 5, "title": "The Fifth Season", "authorId": 3, "genre": "Fantasy", "year": 2015},
    {"id": 6, "title": "The City We Became", "authorId": 3, "genre": "Urban Fantasy", "year": 2020},
    {"id": 7, "title": "Go Tell It on the Mountain", "authorId": 4, "genre": "Literary Fiction", "year": 1953},
    {"id": 8, "title": "Giovanni's Room", "authorId": 4, "genre": "Literary Fiction", "year": 1956},
]

SMALL_BOOKS = HARDCODED_BOOKS + [
    {"id": 9, "title": "The Left Hand of Darkness", "authorId": 5, "genre": "Science Fiction", "year": 1969},
    {"id": 10, "title": "A Wizard of Earthsea", "authorId": 5, "genre": "Fantasy", "year": 1968},
    {"id": 11, "title": "Norwegian Wood", "authorId": 6, "genre": "Literary Fiction", "year": 1987},
    {"id": 12, "title": "Kafka on the Shore", "authorId": 6, "genre": "Magical Realism", "year": 2002},
    {"id": 13, "title": "Americanah", "authorId": 7, "genre": "Literary Fiction", "year": 2013},
    {"id": 14, "title": "Half of a Yellow Sun", "authorId": 7, "genre": "Historical Fiction", "year": 2006},
    {"id": 15, "title": "Going Postal", "authorId": 8, "genre": "Fantasy", "year": 2004},
    {"id": 16, "title": "Small Gods", "authorId": 8, "genre": "Fantasy", "year": 1992},
]

SMALL_STATS = {
    "totalAuthors": 8,
    "totalBooks": 16,
    "earliestYear": 1953,
    "latestYear": 2020,
    "averageYear": 1987.25,
    "booksByGenre": {
        "Fantasy": 4,
        "Historical Fiction": 1,
        "Literary Fiction": 6,
        "Magical Realism": 1,
        "Science Fiction": 3,
        "Urban Fantasy": 1,
    },
    "authorsByBookCount": {
        "Octavia Butler": 2,
        "Toni Morrison": 2,
        "N.K. Jemisin": 2,
        "James Baldwin": 2,
        "Ursula K. Le Guin": 2,
        "Haruki Murakami": 2,
        "Chimamanda Ngozi Adichie": 2,
        "Terry Pratchett": 2,
    },
}

# ─── HTTP Helpers ────────────────────────────────────────────────────────────

def http_get(url):
    """Make a GET request. Returns (status_code, headers, parsed_json_or_None)."""
    try:
        req = Request(url, method="GET")
        req.add_header("Accept", "application/json")
        with urlopen(req, timeout=10) as resp:
            body = resp.read().decode("utf-8")
            try:
                data = json.loads(body)
            except json.JSONDecodeError:
                data = None
            return resp.status, dict(resp.headers), data
    except HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            data = None
        return e.code, dict(e.headers), data
    except URLError as e:
        return None, None, None


def http_post(url, payload):
    """Make a POST request with JSON body. Returns (status_code, headers, parsed_json_or_None)."""
    try:
        body = json.dumps(payload).encode("utf-8")
        req = Request(url, data=body, method="POST")
        req.add_header("Content-Type", "application/json")
        req.add_header("Accept", "application/json")
        with urlopen(req, timeout=10) as resp:
            resp_body = resp.read().decode("utf-8")
            try:
                data = json.loads(resp_body)
            except json.JSONDecodeError:
                data = None
            return resp.status, dict(resp.headers), data
    except HTTPError as e:
        resp_body = e.read().decode("utf-8")
        try:
            data = json.loads(resp_body)
        except json.JSONDecodeError:
            data = None
        return e.code, dict(e.headers), data
    except URLError as e:
        return None, None, None


# ─── Test Framework ──────────────────────────────────────────────────────────

class TestResult:
    def __init__(self, name, passed, message=""):
        self.name = name
        self.passed = passed
        self.message = message

    def __repr__(self):
        status = "PASS" if self.passed else "FAIL"
        msg = f" — {self.message}" if self.message else ""
        return f"  {'✓' if self.passed else '✗'} {self.name}{msg}"


class TestSuite:
    def __init__(self, base_url, level, verbose=False):
        self.base_url = base_url.rstrip("/")
        self.level = level
        self.verbose = verbose
        self.results = []
        self.is_hardcoded = level == "hardcoded"
        self.authors = HARDCODED_AUTHORS if self.is_hardcoded else SMALL_AUTHORS
        self.books = HARDCODED_BOOKS if self.is_hardcoded else SMALL_BOOKS

    def add(self, name, passed, message=""):
        result = TestResult(name, passed, message)
        self.results.append(result)
        return result

    def url(self, path):
        return f"{self.base_url}{path}"

    # ── Phase 1: Smoke Test ──

    def phase_smoke(self):
        status, headers, data = http_get(self.url("/api/authors"))
        if status is None:
            self.add("API reachable", False, "Could not connect to API")
            return False
        self.add("API reachable", status == 200, f"GET /api/authors returned {status}")
        if status != 200:
            return False

        ct = headers.get("Content-Type", headers.get("content-type", ""))
        is_json = "application/json" in ct.lower()
        self.add("Content-Type is JSON", is_json, f"Got: {ct}")

        is_list = isinstance(data, list)
        self.add("Response is array", is_list, f"Got type: {type(data).__name__}")
        return is_json and is_list

    # ── Phase 2: Read Correctness ──

    def phase_read(self):
        all_pass = True

        # GET /api/authors
        status, _, data = http_get(self.url("/api/authors"))
        ok = status == 200 and isinstance(data, list) and len(data) == len(self.authors)
        self.add(f"GET /api/authors returns {len(self.authors)} authors", ok,
                 f"Got {len(data) if isinstance(data, list) else 'non-array'}")
        all_pass = all_pass and ok

        # Check camelCase keys on authors
        if data and isinstance(data, list) and len(data) > 0:
            keys = set(data[0].keys())
            expected_keys = {"id", "name", "bio"}
            ok = expected_keys.issubset(keys)
            self.add("Author has correct keys (id, name, bio)", ok, f"Got: {keys}")
            all_pass = all_pass and ok

        # GET /api/authors/{id} for first and last
        for author in [self.authors[0], self.authors[-1]]:
            status, _, data = http_get(self.url(f"/api/authors/{author['id']}"))
            ok = status == 200 and isinstance(data, dict) and data.get("name") == author["name"]
            self.add(f"GET /api/authors/{author['id']} returns {author['name']}", ok,
                     f"Got: {data.get('name') if isinstance(data, dict) else data}")
            all_pass = all_pass and ok

        # GET /api/books
        status, _, data = http_get(self.url("/api/books"))
        # v3 without keyword returns paginated; v1/v2/hardcoded returns flat array
        if self.level == "v3":
            is_paginated = isinstance(data, dict) and "data" in data
            if is_paginated:
                book_list = data["data"]
            else:
                book_list = data
        else:
            book_list = data

        ok = status == 200 and isinstance(book_list, list) and len(book_list) == len(self.books)
        self.add(f"GET /api/books returns {len(self.books)} books", ok,
                 f"Got {len(book_list) if isinstance(book_list, list) else 'non-array'}")
        all_pass = all_pass and ok

        # Check camelCase keys on books (authorId, not author_id)
        if book_list and isinstance(book_list, list) and len(book_list) > 0:
            keys = set(book_list[0].keys())
            ok = "authorId" in keys
            self.add("Book uses camelCase 'authorId' (not 'author_id')", ok, f"Got keys: {keys}")
            all_pass = all_pass and ok
            expected_keys = {"id", "title", "authorId", "genre", "year", "description"}
            ok = expected_keys.issubset(keys)
            self.add("Book has all required keys", ok, f"Got: {keys}, expected: {expected_keys}")
            all_pass = all_pass and ok

        # GET /api/books/{id} for first and last
        for book in [self.books[0], self.books[-1]]:
            status, _, data = http_get(self.url(f"/api/books/{book['id']}"))
            ok = status == 200 and isinstance(data, dict) and data.get("title") == book["title"]
            self.add(f"GET /api/books/{book['id']} returns '{book['title']}'", ok,
                     f"Got: {data.get('title') if isinstance(data, dict) else data}")
            all_pass = all_pass and ok

        return all_pass

    # ── Phase 3: Filter Correctness (v2+) ──

    def phase_filter(self):
        all_pass = True

        # keyword=butler on authors → 1 result (Octavia Butler)
        status, _, data = http_get(self.url("/api/authors?keyword=butler"))
        ok = status == 200 and isinstance(data, list) and len(data) == 1
        self.add("GET /api/authors?keyword=butler → 1 result", ok,
                 f"Got {len(data) if isinstance(data, list) else 'non-array'} results")
        all_pass = all_pass and ok
        if ok:
            ok2 = data[0].get("name") == "Octavia Butler"
            self.add("  Result is Octavia Butler", ok2, f"Got: {data[0].get('name')}")
            all_pass = all_pass and ok2

        # keyword=hugo on authors → N.K. Jemisin (bio match)
        status, _, data = http_get(self.url("/api/authors?keyword=hugo"))
        ok = status == 200 and isinstance(data, list) and len(data) >= 1
        self.add("GET /api/authors?keyword=hugo → matches bio", ok,
                 f"Got {len(data) if isinstance(data, list) else 'non-array'} results")
        all_pass = all_pass and ok
        if ok:
            names = [a.get("name") for a in data]
            ok2 = "N.K. Jemisin" in names
            self.add("  Result includes N.K. Jemisin", ok2, f"Got: {names}")
            all_pass = all_pass and ok2

        # Case insensitivity: keyword=BUTLER
        status, _, data = http_get(self.url("/api/authors?keyword=BUTLER"))
        ok = status == 200 and isinstance(data, list) and len(data) == 1
        self.add("GET /api/authors?keyword=BUTLER (case insensitive)", ok,
                 f"Got {len(data) if isinstance(data, list) else 'non-array'} results")
        all_pass = all_pass and ok

        # keyword=fantasy on books → 5 results (Fantasy x4 + Urban Fantasy x1)
        status, _, data = http_get(self.url("/api/books?keyword=fantasy"))
        ok = status == 200 and isinstance(data, list) and len(data) == 5
        self.add("GET /api/books?keyword=fantasy → 5 results", ok,
                 f"Got {len(data) if isinstance(data, list) else 'non-array'} results")
        all_pass = all_pass and ok

        # keyword=tortoise on books → 1 result (Small Gods description match)
        status, _, data = http_get(self.url("/api/books?keyword=tortoise"))
        ok = status == 200 and isinstance(data, list) and len(data) == 1
        self.add("GET /api/books?keyword=tortoise → 1 result (description match)", ok,
                 f"Got {len(data) if isinstance(data, list) else 'non-array'} results")
        all_pass = all_pass and ok

        # keyword=1987 on books → 0 results (year NOT searched)
        status, _, data = http_get(self.url("/api/books?keyword=1987"))
        ok = status == 200 and isinstance(data, list) and len(data) == 0
        self.add("GET /api/books?keyword=1987 → 0 results (year not searched)", ok,
                 f"Got {len(data) if isinstance(data, list) else 'non-array'} results")
        all_pass = all_pass and ok

        # Non-matching filter → 200 with empty array
        status, _, data = http_get(self.url("/api/authors?keyword=zzzznonexistent"))
        ok = status == 200 and isinstance(data, list) and len(data) == 0
        self.add("Non-matching filter returns 200 with empty array", ok,
                 f"Got status {status}, {len(data) if isinstance(data, list) else 'non-array'} results")
        all_pass = all_pass and ok

        return all_pass

    # ── Phase 4: Search Correctness (v2+) ──

    def phase_search(self):
        all_pass = True

        # GET /api/search?keyword=science fiction → authors AND books
        status, _, data = http_get(self.url("/api/search?keyword=science%20fiction"))
        ok = status == 200 and isinstance(data, dict) and "authors" in data and "books" in data
        self.add("GET /api/search?keyword=science fiction → has authors and books", ok,
                 f"Got status {status}, keys: {list(data.keys()) if isinstance(data, dict) else 'non-object'}")
        all_pass = all_pass and ok

        if ok:
            # Should find authors with "science fiction" in bio + books with "Science Fiction" genre
            ok2 = len(data["authors"]) >= 1 and len(data["books"]) >= 1
            self.add("  Search returns both author and book matches", ok2,
                     f"Got {len(data['authors'])} authors, {len(data['books'])} books")
            all_pass = all_pass and ok2

        # Missing keyword → 400
        status, _, data = http_get(self.url("/api/search"))
        ok = status == 400
        self.add("GET /api/search (no keyword) → 400", ok, f"Got status {status}")
        all_pass = all_pass and ok

        if ok and isinstance(data, dict):
            ok2 = "error" in data
            self.add("  400 response has 'error' field", ok2, f"Got keys: {list(data.keys())}")
            all_pass = all_pass and ok2

        return all_pass

    # ── Phase 5: Relationship (v2+) ──

    def phase_relationship(self):
        all_pass = True

        # GET /api/authors/1/books → books by Octavia Butler
        status, _, data = http_get(self.url("/api/authors/1/books"))
        ok = status == 200 and isinstance(data, list) and len(data) == 2
        self.add("GET /api/authors/1/books → 2 books", ok,
                 f"Got {len(data) if isinstance(data, list) else 'non-array'} results")
        all_pass = all_pass and ok

        if ok:
            titles = sorted([b.get("title") for b in data])
            expected = sorted(["Kindred", "Parable of the Sower"])
            ok2 = titles == expected
            self.add("  Books are Kindred and Parable of the Sower", ok2, f"Got: {titles}")
            all_pass = all_pass and ok2

        # GET /api/authors/9999/books → 404
        status, _, data = http_get(self.url("/api/authors/9999/books"))
        ok = status == 404
        self.add("GET /api/authors/9999/books → 404", ok, f"Got status {status}")
        all_pass = all_pass and ok

        return all_pass

    # ── Phase 6: Write Correctness (v3) ──

    def phase_write(self):
        all_pass = True

        # POST /api/books with valid data → 201
        new_book = {
            "title": "Test Book From Validator",
            "authorId": 1,
            "genre": "Test Genre",
            "year": 2024,
            "description": "A test book created by the validator."
        }
        status, _, data = http_post(self.url("/api/books"), new_book)
        ok = status == 201 and isinstance(data, dict) and "id" in data
        self.add("POST /api/books with valid data → 201", ok,
                 f"Got status {status}, data: {data}")
        all_pass = all_pass and ok

        if ok:
            created_id = data["id"]
            ok2 = data.get("title") == "Test Book From Validator"
            self.add("  Created book has correct title", ok2, f"Got: {data.get('title')}")
            all_pass = all_pass and ok2

            # Verify persistence
            status2, _, data2 = http_get(self.url(f"/api/books/{created_id}"))
            ok3 = status2 == 200 and isinstance(data2, dict) and data2.get("title") == "Test Book From Validator"
            self.add("  Created book persists (GET by id)", ok3,
                     f"Got status {status2}")
            all_pass = all_pass and ok3

        # POST with missing title → 400
        bad_book = {"authorId": 1, "genre": "Test", "year": 2024, "description": "No title"}
        status, _, data = http_post(self.url("/api/books"), bad_book)
        ok = status == 400
        self.add("POST /api/books with missing title → 400", ok, f"Got status {status}")
        all_pass = all_pass and ok

        # POST with invalid authorId → 400
        bad_book2 = {"title": "Bad", "authorId": 99999, "genre": "Test", "year": 2024, "description": "Bad author"}
        status, _, data = http_post(self.url("/api/books"), bad_book2)
        ok = status == 400
        self.add("POST /api/books with invalid authorId → 400", ok, f"Got status {status}")
        all_pass = all_pass and ok

        # POST with invalid year → 400
        bad_book3 = {"title": "Bad", "authorId": 1, "genre": "Test", "year": 999, "description": "Bad year"}
        status, _, data = http_post(self.url("/api/books"), bad_book3)
        ok = status == 400
        self.add("POST /api/books with year < 1000 → 400", ok, f"Got status {status}")
        all_pass = all_pass and ok

        return all_pass

    # ── Phase 7: Compute / Stats (v3) ──

    def phase_stats(self):
        all_pass = True

        status, _, data = http_get(self.url("/api/stats"))
        ok = status == 200 and isinstance(data, dict)
        self.add("GET /api/stats → 200", ok, f"Got status {status}")
        if not ok:
            return False

        # Note: stats may be affected by POST test creating a book.
        # We check the base values assuming the POST test hasn't run yet,
        # or we accept minor deviations. For a clean test, stats are checked
        # against expected small-seed values, but we also need to account for
        # the book the write test may have added.

        # Check totalAuthors
        ok = data.get("totalAuthors") == SMALL_STATS["totalAuthors"]
        self.add("  totalAuthors correct", ok,
                 f"Expected {SMALL_STATS['totalAuthors']}, got {data.get('totalAuthors')}")
        all_pass = all_pass and ok

        # totalBooks — may be 16 or 17 if POST test ran first
        total_books = data.get("totalBooks")
        ok = total_books in (SMALL_STATS["totalBooks"], SMALL_STATS["totalBooks"] + 1)
        self.add("  totalBooks correct", ok,
                 f"Expected {SMALL_STATS['totalBooks']}(+1 if POST ran), got {total_books}")
        all_pass = all_pass and ok

        # earliestYear
        ok = data.get("earliestYear") == SMALL_STATS["earliestYear"]
        self.add("  earliestYear correct", ok,
                 f"Expected {SMALL_STATS['earliestYear']}, got {data.get('earliestYear')}")
        all_pass = all_pass and ok

        # latestYear (may be 2020 or 2024 if POST test ran)
        ok = data.get("latestYear") in (SMALL_STATS["latestYear"], 2024)
        self.add("  latestYear correct", ok,
                 f"Expected {SMALL_STATS['latestYear']}(or 2024), got {data.get('latestYear')}")
        all_pass = all_pass and ok

        # averageYear — check it's a number and roughly correct
        avg = data.get("averageYear")
        ok = isinstance(avg, (int, float)) and abs(avg - SMALL_STATS["averageYear"]) < 5
        self.add("  averageYear approximately correct", ok,
                 f"Expected ~{SMALL_STATS['averageYear']}, got {avg}")
        all_pass = all_pass and ok

        # booksByGenre
        ok = isinstance(data.get("booksByGenre"), dict)
        self.add("  booksByGenre is object", ok, f"Got type: {type(data.get('booksByGenre')).__name__}")
        all_pass = all_pass and ok
        if ok:
            genre_data = data["booksByGenre"]
            # Check at least the main genres are present
            ok2 = genre_data.get("Fantasy", 0) >= 4 and genre_data.get("Literary Fiction", 0) >= 6
            self.add("  booksByGenre has correct counts for main genres", ok2,
                     f"Fantasy={genre_data.get('Fantasy')}, Literary Fiction={genre_data.get('Literary Fiction')}")
            all_pass = all_pass and ok2

        # authorsByBookCount
        ok = isinstance(data.get("authorsByBookCount"), dict)
        self.add("  authorsByBookCount is object", ok,
                 f"Got type: {type(data.get('authorsByBookCount')).__name__}")
        all_pass = all_pass and ok
        if ok:
            abc = data["authorsByBookCount"]
            ok2 = abc.get("Octavia Butler", 0) >= 2
            self.add("  authorsByBookCount has Octavia Butler with >= 2 books", ok2,
                     f"Got: {abc.get('Octavia Butler')}")
            all_pass = all_pass and ok2

        return all_pass

    # ── Phase 8: Error Handling ──

    def phase_errors(self):
        all_pass = True

        # 404 for missing author
        status, _, data = http_get(self.url("/api/authors/9999"))
        ok = status == 404
        self.add("GET /api/authors/9999 → 404", ok, f"Got status {status}")
        all_pass = all_pass and ok

        if isinstance(data, dict):
            ok2 = "error" in data
            self.add("  404 response has 'error' field", ok2, f"Got keys: {list(data.keys())}")
            all_pass = all_pass and ok2

        # 404 for missing book
        status, _, data = http_get(self.url("/api/books/9999"))
        ok = status == 404
        self.add("GET /api/books/9999 → 404", ok, f"Got status {status}")
        all_pass = all_pass and ok

        return all_pass

    # ── Phase 9: Pagination (v3) ──

    def phase_pagination(self):
        all_pass = True

        # Default pagination (page=1, limit=20)
        status, _, data = http_get(self.url("/api/books"))
        ok = (status == 200 and isinstance(data, dict) and
              "data" in data and "page" in data and "limit" in data and
              "totalItems" in data and "totalPages" in data)
        self.add("GET /api/books returns paginated wrapper", ok,
                 f"Got keys: {list(data.keys()) if isinstance(data, dict) else 'non-object'}")
        all_pass = all_pass and ok

        if ok:
            ok2 = data["page"] == 1 and data["limit"] == 20
            self.add("  Default page=1, limit=20", ok2,
                     f"Got page={data['page']}, limit={data['limit']}")
            all_pass = all_pass and ok2

            total = data["totalItems"]
            ok3 = total >= 16  # At least the seed data
            self.add("  totalItems >= 16", ok3, f"Got totalItems={total}")
            all_pass = all_pass and ok3

        # Custom limit
        status, _, data = http_get(self.url("/api/books?limit=5"))
        ok = (status == 200 and isinstance(data, dict) and
              isinstance(data.get("data"), list) and len(data["data"]) == 5)
        self.add("GET /api/books?limit=5 → 5 items in data", ok,
                 f"Got {len(data.get('data', [])) if isinstance(data, dict) else 'non-object'} items")
        all_pass = all_pass and ok

        # Page 2
        status, _, data = http_get(self.url("/api/books?limit=5&page=2"))
        ok = (status == 200 and isinstance(data, dict) and data.get("page") == 2)
        self.add("GET /api/books?limit=5&page=2 → page=2", ok,
                 f"Got page={data.get('page') if isinstance(data, dict) else 'non-object'}")
        all_pass = all_pass and ok

        # Beyond last page → empty data
        status, _, data = http_get(self.url("/api/books?page=9999"))
        ok = (status == 200 and isinstance(data, dict) and
              isinstance(data.get("data"), list) and len(data["data"]) == 0)
        self.add("GET /api/books?page=9999 → empty data array", ok,
                 f"Got {len(data.get('data', [])) if isinstance(data, dict) else 'non-object'} items")
        all_pass = all_pass and ok

        # totalPages consistency
        status, _, data = http_get(self.url("/api/books?limit=5"))
        if status == 200 and isinstance(data, dict):
            total_items = data.get("totalItems", 0)
            total_pages = data.get("totalPages", 0)
            import math
            expected_pages = math.ceil(total_items / 5) if total_items > 0 else 0
            ok = total_pages == expected_pages
            self.add("  totalPages consistent with totalItems/limit", ok,
                     f"Expected {expected_pages}, got {total_pages}")
            all_pass = all_pass and ok

        # GET /api/books?keyword=X → flat array (NOT paginated) even in v3
        status, _, data = http_get(self.url("/api/books?keyword=fantasy"))
        ok = status == 200 and isinstance(data, list)
        self.add("GET /api/books?keyword=fantasy → flat array (not paginated)", ok,
                 f"Got type: {type(data).__name__}")
        all_pass = all_pass and ok

        return all_pass

    # ── Run All Phases for a Level ──

    def run(self):
        """Run all phases for the configured level. Returns (passed, total)."""
        # Phase 1: Smoke
        if not self.phase_smoke():
            return self._summary()

        # Phase 2: Read
        self.phase_read()

        # Phase 8: Errors (all levels)
        self.phase_errors()

        if self.level in ("v2", "v3"):
            # Phase 3: Filter
            self.phase_filter()
            # Phase 4: Search
            self.phase_search()
            # Phase 5: Relationship
            self.phase_relationship()

        if self.level == "v3":
            # Phase 6: Write
            self.phase_write()
            # Phase 7: Stats
            self.phase_stats()
            # Phase 9: Pagination
            self.phase_pagination()

        return self._summary()

    def _summary(self):
        passed = sum(1 for r in self.results if r.passed)
        total = len(self.results)
        return passed, total


# ─── Auto-Detect Mode ───────────────────────────────────────────────────────

def auto_detect(base_url, verbose=False):
    """Try each level, report the highest passing level.

    Hardcoded and v1 have different expected data (4 vs 8 authors), so an entry
    will typically pass one path or the other. We try all levels and track the
    highest that passes, plus the first failure after the detected level.
    """
    levels = [
        ("hardcoded", "Hardcoded (4 endpoints, in-memory)"),
        ("v1", "v1 (4 endpoints, SQLite)"),
        ("v2", "v2 (+ filtering, search)"),
        ("v3", "v3 (+ POST, stats, pagination)"),
    ]

    print("\n=== Auto-detecting level ===")
    detected = None
    last_failures = []
    results_by_level = []

    for level, description in levels:
        suite = TestSuite(base_url, level, verbose)
        passed, total = suite.run()

        if passed == total:
            status = "PASS"
            detected = level
            last_failures = []  # Clear failures since we found a higher passing level
        else:
            status = "FAIL"

        pad = "." * max(1, 40 - len(description))
        print(f"  {description} {pad} {status} ({passed}/{total})")

        if status == "FAIL":
            failures = [r for r in suite.results if not r.passed]
            if verbose:
                for r in failures:
                    print(f"    {r}")
            # If we already detected a level and this one fails, show why and stop
            if detected is not None:
                last_failures = failures
                for r in failures:
                    print(f"    {r}")
                break
            # If nothing detected yet (e.g., hardcoded fails), keep trying higher levels

    print()
    if detected:
        print(f"  Detected level: {detected}")
        if last_failures:
            level_names = [l[0] for l in levels]
            detected_idx = level_names.index(detected)
            if detected_idx < len(level_names) - 1:
                next_level = level_names[detected_idx + 1]
                print(f"  To reach {next_level}, fix the {len(last_failures)} failure(s) above.")
    else:
        print("  Detected level: NONE (no level passed)")
        print("  Make sure the API is running and accessible.")

    print()
    return detected


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Book API Tournament Validator")
    parser.add_argument("base_url", help="Base URL of the API (e.g., http://localhost:8080)")
    parser.add_argument("--level", choices=["hardcoded", "v1", "v2", "v3"], default="v3",
                        help="Validation level (default: v3)")
    parser.add_argument("--detect", action="store_true",
                        help="Auto-detect the highest passing level")
    parser.add_argument("--verbose", action="store_true",
                        help="Show individual test results")

    args = parser.parse_args()

    if args.detect:
        detected = auto_detect(args.base_url, args.verbose)
        sys.exit(0 if detected else 1)

    # Single-level validation
    suite = TestSuite(args.base_url, args.level, args.verbose)
    passed, total = suite.run()

    level_label = args.level.upper() if args.level != "hardcoded" else "HARDCODED"
    print(f"\n=== {level_label} Validation ===")

    if args.verbose:
        for r in suite.results:
            print(r)
        print()

    if passed == total:
        print(f"  PASS ({passed}/{total} tests passed)")
        print()
        sys.exit(0)
    else:
        failures = [r for r in suite.results if not r.passed]
        print(f"  FAIL ({passed}/{total} tests passed, {len(failures)} failures)")
        print()
        for r in failures:
            print(r)
        print()
        sys.exit(1)


if __name__ == "__main__":
    main()
