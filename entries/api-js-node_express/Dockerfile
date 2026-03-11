FROM node:20-slim
WORKDIR /app

# Install build tools for better-sqlite3 native addon + sqlite3 CLI for DB init
RUN apt-get update && apt-get install -y python3 make g++ sqlite3 && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --production

COPY . .

COPY db/schema.sql db/seed-small.sql /app/db/
RUN cat /app/db/schema.sql /app/db/seed-small.sql | sqlite3 /app/books.db

ENV DB_PATH=/app/books.db
EXPOSE 8080
CMD ["node", "app.js"]
