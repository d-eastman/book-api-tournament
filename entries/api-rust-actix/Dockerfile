FROM rust:1-slim-bookworm AS build
WORKDIR /app
RUN apt-get update && apt-get install -y pkg-config libssl-dev build-essential && rm -rf /var/lib/apt/lists/*
COPY Cargo.toml ./
RUN mkdir src && echo 'fn main(){}' > src/main.rs && cargo build --release 2>/dev/null || true
COPY . .
RUN touch src/main.rs && cargo build --release

FROM debian:bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*
COPY db/schema.sql db/seed-small.sql /app/db/
RUN cat /app/db/schema.sql /app/db/seed-small.sql | sqlite3 /app/books.db
COPY --from=build /app/target/release/api-rust-actix .
ENV DB_PATH=/app/books.db
EXPOSE 8080
CMD ["./api-rust-actix"]
