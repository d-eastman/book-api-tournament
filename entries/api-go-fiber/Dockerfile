# Build stage
FROM golang:1.22-bookworm AS build
WORKDIR /app
COPY go.mod ./
RUN go mod download || true
COPY . .
RUN go mod tidy && CGO_ENABLED=1 GOOS=linux go build -o server .

# Runtime stage
FROM debian:bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*
COPY db/schema.sql db/seed-small.sql /app/db/
RUN cat /app/db/schema.sql /app/db/seed-small.sql | sqlite3 /app/books.db
COPY --from=build /app/server .
ENV DB_PATH=/app/books.db
EXPOSE 8080
CMD ["./server"]
