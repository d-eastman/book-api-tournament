FROM oven/bun:1-debian
WORKDIR /app

RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock* ./
RUN bun install --production

COPY . .

COPY db/schema.sql db/seed-small.sql /app/db/
RUN cat /app/db/schema.sql /app/db/seed-small.sql | sqlite3 /app/books.db

ENV DB_PATH=/app/books.db
EXPOSE 8080
CMD ["bun", "run", "src/index.ts"]
