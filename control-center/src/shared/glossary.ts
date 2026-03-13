export interface GlossaryEntry {
  term: string;
  plain: string;
  technical?: string;
  matters?: string;
  unit?: string;
}

export const GLOSSARY: Record<string, GlossaryEntry> = {

  // ── Performance Metrics ──────────────────────────────

  "throughput": {
    term: "Throughput",
    plain: "How many requests the API can handle per second. Think of it as the speed limit — higher means faster.",
    technical: "Measured as successful HTTP responses per second under sustained concurrent load. Reported by the load testing tool (oha/hey) after excluding the warmup period.",
    matters: "If your API handles 1,000 users and each makes 10 requests per page load, you need at least 10,000 req/s to keep up.",
    unit: "req/s",
  },

  "req/s": {
    term: "req/s",
    plain: "Requests per second — how many people the API can serve at the same time. Higher is better.",
    unit: "req/s",
  },

  "latency": {
    term: "Latency",
    plain: "How long a single request takes from start to finish. Lower is better — it's the wait time your users feel.",
    technical: "Measured as the time between sending the HTTP request and receiving the complete response, including network round-trip within localhost.",
    matters: "Users perceive anything under 100ms as instant. Above 300ms feels sluggish. Above 1 second feels broken.",
    unit: "ms",
  },

  "p50": {
    term: "p50 Latency",
    plain: "The median response time — half of all requests were faster than this, half were slower. This is the 'typical' experience.",
    technical: "The 50th percentile of the response time distribution. More representative than average because it's not skewed by outliers.",
    matters: "This is what most of your users will experience on most requests.",
    unit: "ms",
  },

  "p95": {
    term: "p95 Latency",
    plain: "95% of requests were faster than this. Only 1 in 20 was slower. This is where you start to see the slow tail.",
    technical: "The 95th percentile. Useful for SLO (Service Level Objective) targets — many teams set their SLO at p95.",
    matters: "If you have 10,000 daily users, 500 of them experience latency worse than this on every request.",
    unit: "ms",
  },

  "p99": {
    term: "p99 Latency",
    plain: "99% of requests were faster than this. Only 1 in 100 was slower. This is the worst-case scenario for almost everyone.",
    technical: "The 99th percentile, often called 'tail latency.' Sensitive to garbage collection pauses, connection pool exhaustion, and cold cache misses.",
    matters: "At scale, p99 matters more than average. If your API serves 1 million requests/day, 10,000 of them hit this latency or worse.",
    unit: "ms",
  },

  "average latency": {
    term: "Average Latency",
    plain: "The mean response time across all requests. Can be misleading — one very slow request drags the average up even if most were fast.",
    technical: "Arithmetic mean of all response times. Less useful than percentiles for understanding user experience because it's heavily influenced by outliers.",
    unit: "ms",
  },

  // ── Resource Metrics ─────────────────────────────────

  "memory": {
    term: "Memory",
    plain: "How much RAM the API uses. Less memory means you can run more copies on the same server, which saves money.",
    technical: "Measured via `docker stats` as the container's resident set size (RSS). Includes heap, stack, runtime overhead, and memory-mapped files.",
    unit: "MiB",
  },

  "idle memory": {
    term: "Idle Memory",
    plain: "RAM used when the API is running but nobody is using it. This is the baseline cost just to have it deployed.",
    technical: "Measured after startup and health check, before any benchmark load. Represents the runtime's fixed overhead: loaded classes, JIT compiler state, connection pools, framework initialization.",
    matters: "In Kubernetes, this is roughly your memory request — the minimum the scheduler reserves for your pod.",
    unit: "MiB",
  },

  "loaded memory": {
    term: "Memory Under Load",
    plain: "RAM used when the API is being hit with lots of requests. This is how hungry it gets when it's actually working.",
    technical: "Measured via `docker stats` during or immediately after the benchmark run. Includes all runtime allocations, in-flight request buffers, and GC pressure.",
    matters: "This should be your Kubernetes memory limit. If the pod exceeds this, it gets OOM-killed.",
    unit: "MiB",
  },

  "MiB": {
    term: "MiB",
    plain: "Mebibytes — a unit of memory. 1 MiB = 1,048,576 bytes. Roughly 1 megabyte. Your phone typically has 4,000-8,000 MiB of RAM.",
  },

  "startup time": {
    term: "Startup Time",
    plain: "How long it takes the API to go from 'starting...' to 'ready to serve requests.' Faster startup = faster deployments and scaling.",
    technical: "Measured as wall-clock time from `docker run` to the first successful HTTP 200 response on the health check endpoint.",
    matters: "Critical for serverless (cold start penalty), Kubernetes scaling (new pods during traffic spikes), and CI/CD (deployment speed).",
    unit: "ms",
  },

  "image size": {
    term: "Docker Image Size",
    plain: "How big the packaged application is. Smaller images download faster and take less disk space on your servers.",
    technical: "The compressed size of the Docker image as reported by `docker image inspect`. Includes the base OS layer, runtime, dependencies, and the application binary.",
    matters: "In a CI/CD pipeline, image pull time directly impacts deployment speed. A 5 MB Go image pulls in under a second; a 200 MB Ruby image takes 10-30 seconds.",
    unit: "MB",
  },

  "efficiency": {
    term: "Efficiency",
    plain: "How much speed you get per megabyte of RAM. Higher means the framework gives you more bang for your cloud computing buck.",
    technical: "Calculated as throughput (req/s) divided by memory under load (MiB). Frameworks that are fast AND lean score highest.",
    matters: "If you're paying per GB of RAM in the cloud, this is the metric that maps most directly to your infrastructure bill.",
    unit: "req/s per MiB",
  },

  // ── Architecture Concepts ────────────────────────────

  "event loop": {
    term: "Event Loop",
    plain: "A single thread that juggles many requests by quickly switching between them instead of handling one at a time. Like a chef cooking 10 dishes by rotating between them instead of finishing each one before starting the next.",
    technical: "A concurrency model where a single thread polls for I/O readiness (epoll/kqueue) and dispatches callbacks. Used by Node.js, Vert.x, and Nginx. Never blocks — if a handler blocks, the entire server stalls.",
  },

  "thread-per-request": {
    term: "Thread-Per-Request",
    plain: "Each incoming request gets its own dedicated worker. Simple to understand but expensive — each worker uses about 1 MB of RAM and the server runs out of workers under heavy load.",
    technical: "The traditional servlet model. A thread pool of N threads handles N concurrent requests. If all threads are busy (e.g., waiting on database calls), new requests queue. Throughput ceiling = pool_size / avg_response_time.",
  },

  "virtual threads": {
    term: "Virtual Threads",
    plain: "Lightweight threads managed by the Java runtime instead of the operating system. You get millions of them instead of hundreds, so blocking code scales like async code without the complexity.",
    technical: "Java 21's Project Loom. Virtual threads are multiplexed onto a small number of OS carrier threads. When a virtual thread blocks (Thread.sleep, JDBC), the carrier thread is freed for other work. Write blocking code, get async performance.",
  },

  "coroutines": {
    term: "Coroutines",
    plain: "A way to pause a function in the middle, do something else, and come back later. Like bookmarking your place in a book to read another one, then picking up where you left off.",
    technical: "Kotlin/Ktor coroutines suspend at suspension points (delay(), withContext()) and free the underlying thread. The key distinction: delay() suspends (good), Thread.sleep() blocks (bad). Dispatchers.Default for CPU work, Dispatchers.IO for blocking I/O.",
  },

  "GIL": {
    term: "GIL (Global Interpreter Lock)",
    plain: "A lock in Python (and Ruby) that only lets one thread run Python code at a time. It's why Python can't fully use multiple CPU cores for computation, even with threads.",
    technical: "The CPython GIL serializes access to Python objects, preventing true parallel execution of Python bytecode. Threads still help for I/O-bound work (the GIL is released during I/O waits), but CPU-bound multithreading sees no speedup.",
    matters: "This is why Python frameworks like Django and Flask are significantly slower than Go or Rust on CPU-bound workloads — they can't parallelize the request handling across cores.",
  },

  "CGI": {
    term: "CGI (Common Gateway Interface)",
    plain: "The oldest way to run a web application — every request starts a brand new process. Extremely slow by modern standards because process creation is expensive.",
    technical: "The web server (Apache) spawns a new OS process for each HTTP request, passes the request as environment variables, and reads the response from stdout. No connection reuse, no in-memory state between requests. COBOL on Wheelchair uses this model.",
  },

  "SQLite": {
    term: "SQLite",
    plain: "A tiny database that lives inside your application as a single file. No separate server to install or manage. Perfect for small applications and testing.",
    technical: "An embedded relational database engine. The entire database is a single file on disk. Supports SQL, transactions, and concurrent reads. Write operations take a file-level lock. Used in this tournament as the standard data layer for v1/v2/v3 entries.",
  },

  // ── Benchmark Concepts ─────────────────────────────

  "concurrency": {
    term: "Concurrency",
    plain: "How many requests are being sent to the API at the same time. Like the number of people standing in line at a counter — more people means more pressure on the server.",
    technical: "The number of simultaneous open HTTP connections maintained by the load testing tool. Quick mode uses 20 concurrent connections; full mode uses 50.",
  },

  "warmup": {
    term: "Warmup",
    plain: "A batch of requests sent before the actual measurement starts. This gives the API time to optimize itself (load caches, compile hot code paths) so the benchmark measures peak performance, not cold-start performance.",
    technical: "JVM frameworks benefit most from warmup — the JIT compiler identifies hot code paths and compiles them to native code during warmup. Go and Rust don't need warmup (already native) but we include it for fairness.",
  },

  "quick mode": {
    term: "Quick Mode",
    plain: "A fast benchmark that gives rough results in about 15 seconds. Good for development and tournament matchups. Not precise enough for official results.",
    technical: "2,000 requests at 20 concurrency with 500 warmup requests. Results have higher variance than full mode due to smaller sample size.",
  },

  "full mode": {
    term: "Full Mode",
    plain: "A thorough benchmark that takes about 90 seconds but gives reliable, publication-quality results. Used for official season rankings.",
    technical: "20,000 requests at 50 concurrency with 2,000 warmup requests. Large enough sample to produce stable percentile estimates and minimize run-to-run variance.",
  },

  // ── Tournament Concepts ──────────────────────────────

  "bye": {
    term: "Bye",
    plain: "When a tournament bracket doesn't have enough entries to fill every slot, some entries get a free pass to the next round. It's like winning a game without playing.",
    technical: "In a 16-slot bracket with 12 entries, 4 entries receive first-round byes (randomly assigned). They advance to round 2 without being benchmarked in round 1.",
  },

  "bracket": {
    term: "Bracket",
    plain: "The tournament structure showing who faces who. Like March Madness — winners advance, losers go home.",
    technical: "A single-elimination tournament tree with bracket size equal to the next power of 2 above the entry count. Random seeding, random bye assignment.",
  },

  "single elimination": {
    term: "Single Elimination",
    plain: "Lose once and you're out. No second chances. The last framework standing wins.",
  },

  // ── Configuration Concepts ─────────────────────────

  "level": {
    term: "Level",
    plain: "Which tier of the API spec to benchmark. Higher levels have more endpoints — Hardcoded has 4, v1 has 4 with a database, v2 has 6, and v3 has 8.",
    technical: "Entries at or above the selected level are eligible. A v3 entry can compete in a v1 tournament (benchmarked on v1 endpoints only).",
  },

  "data size": {
    term: "Data Size",
    plain: "How much data is in the database during the benchmark. Small has 16 books, medium has 1,000, and large has 50,000. Bigger datasets stress memory and serialization.",
    technical: "Controlled by which seed SQL file initializes the SQLite database. Hardcoded entries always use their fixed 4 authors / 8 books.",
  },

  "endpoints": {
    term: "Endpoints",
    plain: "The API routes that get benchmarked. Each level defines a set of endpoints — the load tester hits each one and measures how fast the API responds.",
  },

  // ── Level Concepts ─────────────────────────────────

  "hardcoded": {
    term: "Hardcoded",
    plain: "An entry level where the data is baked directly into the source code — no database. Reserved for exotic languages like COBOL and Assembly that can't easily connect to a database.",
    technical: "4 authors, 8 books, embedded in source. Implements only the 4 basic GET endpoints. Cannot compete against database-backed entries. Separate league.",
  },

  "v1": {
    term: "Level v1",
    plain: "The starting level. Four basic endpoints (list and get-by-ID for authors and books) backed by a SQLite database.",
  },

  "v2": {
    term: "Level v2",
    plain: "Adds keyword filtering and search to v1. Six endpoints total. Still read-only — no creating or modifying data.",
  },

  "v3": {
    term: "Level v3",
    plain: "The full API. Adds creating new books, aggregate statistics, and paginated listings. Eight endpoints total.",
  },
};
