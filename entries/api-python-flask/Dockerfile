FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
COPY db/schema.sql db/seed-small.sql /app/db/
RUN cat /app/db/schema.sql /app/db/seed-small.sql | sqlite3 /app/books.db
ENV DB_PATH=/app/books.db
EXPOSE 8080
CMD ["python", "app.py"]
