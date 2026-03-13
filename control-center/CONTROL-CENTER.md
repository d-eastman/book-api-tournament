# CONTROL-CENTER.md — Benchmark Control Center App

## Overview

A local web application that serves as the single interface for running benchmarks, managing tournaments, and viewing results across all Book API Tournament entries. Built with Hono (backend) and React (frontend), it manages Docker container lifecycles, executes benchmarks, persists results to CSV files in the repo, and provides both an operator mode for day-to-day benchmarking and a presentation mode for live tournament brackets.

---

## Entry Levels

Every entry declares a single **level** in its `entry.yaml`. See CLAUDE.md for the full level definitions. Summary:

| Level | Endpoints | Database | Data | Competes Against |
|-------|-----------|----------|------|-----------------|
| **v1** | 4 (basic GET) | SQLite | small / medium / large | v1+ at selected data size |
| **v2** | 6 (+ filtering, search) | SQLite | small / medium / large | v2+ at selected data size |
| **v3** | 8 (+ POST, stats, pagination) | SQLite | small / medium / large | v3 at selected data size |

When you select a level for a benchmark or tournament, only eligible entries are shown.

### Benchmarkable Endpoints per Level

| Level | Endpoints Benchmarked | Count |
|-------|----------------------|-------|
| v1 | GET /api/authors, GET /api/books, GET /api/authors/{id}, GET /api/books/{id} | 4 |
| v2 | v1 + GET /api/search?keyword=X, GET /api/authors/{id}/books | 6 |
| v3 | v2 + POST /api/books, GET /api/stats | 8 |

---

## Architecture

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | Hono on Node.js | Lightweight, fast, you know it well |
| Frontend | React + TypeScript (Vite) | Component model fits the multiple-page layout |
| Styling | Tailwind CSS | Quick to build, dark theme for presentation mode |
| Docker | Docker Engine API via dockerode (npm) | Programmatic container lifecycle management |
| Benchmark Tool | oha (preferred) or hey | Invoked as child process from the backend |
| Results Storage | CSV files in `results/` directory | Check into git, no database dependency |

### Project Structure

```
control-center/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── src/
│   ├── server/
│   │   ├── index.ts                    # Hono server entry point
│   │   ├── routes/
│   │   │   ├── entries.ts              # GET /api/entries — list, filter, sort
│   │   │   ├── benchmark.ts            # POST /api/benchmark — run benchmarks
│   │   │   ├── tournament.ts           # POST /api/tournament — manage tournaments
│   │   │   ├── containers.ts           # POST /api/containers — lifecycle management
│   │   │   └── results.ts             # GET /api/results — historical results
│   │   ├── services/
│   │   │   ├── docker.ts              # Docker container lifecycle (dockerode)
│   │   │   ├── benchmark-runner.ts    # Execute oha/hey, parse output
│   │   │   ├── entry-scanner.ts       # Scan entries/ dir, parse entry.yaml files
│   │   │   ├── bracket-generator.ts   # Tournament bracket logic
│   │   │   └── results-store.ts       # Read/write CSV files in results/
│   │   └── types.ts                   # Shared server types
│   ├── client/
│   │   ├── main.tsx                   # React entry point
│   │   ├── App.tsx                    # Router: operator, tournament, results pages
│   │   ├── pages/
│   │   │   ├── OperatorPage.tsx       # Batch benchmark control panel
│   │   │   ├── TournamentPage.tsx     # Live bracket tournament
│   │   │   └── ResultsPage.tsx        # Historical results viewer
│   │   ├── components/
│   │   │   ├── EntrySelector.tsx      # Filterable, sortable entry picker
│   │   │   ├── BenchmarkConfig.tsx    # Spec version, data tier, mode selection
│   │   │   ├── ProgressSpinner.tsx    # Benchmarking in progress indicator
│   │   │   ├── ResultsTable.tsx       # Tabular benchmark results
│   │   │   ├── MetricSelector.tsx     # Dropdown for tournament winning metric
│   │   │   ├── BracketView.tsx        # Tournament bracket visualization
│   │   │   ├── MatchupCard.tsx        # Head-to-head comparison during tournament
│   │   │   ├── WinnerReveal.tsx       # Animated winner announcement
│   │   │   └── SeasonSelector.tsx     # Pick which saved results to view
│   │   ├── hooks/
│   │   │   ├── useEntries.ts          # Fetch and filter entries
│   │   │   ├── useBenchmark.ts        # Trigger and poll benchmark status
│   │   │   └── useTournament.ts       # Tournament state machine
│   │   └── lib/
│   │       ├── api.ts                 # HTTP client for backend
│   │       ├── bracket.ts             # Client-side bracket math (power of 2, byes)
│   │       └── colors.ts             # Language color map
│   └── shared/
│       └── types.ts                   # Types shared between server and client
└── scripts/
    └── detect-tools.sh                # Check for oha, hey, docker availability
```

### Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│  React Frontend (localhost:5173)                              │
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐       │
│  │ Operator     │  │ Tournament   │  │ Results       │       │
│  │ Page         │  │ Page         │  │ Page          │       │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘       │
│         │                │                    │               │
└─────────┼────────────────┼────────────────────┼───────────────┘
          │ HTTP           │ HTTP               │ HTTP
          ▼                ▼                    ▼
┌──────────────────────────────────────────────────────────────┐
│  Hono Backend (localhost:3001)                                │
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐       │
│  │ Entry        │  │ Benchmark    │  │ Results       │       │
│  │ Scanner      │  │ Runner       │  │ Store (CSV)   │       │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘       │
│         │                │                    │               │
│         │         ┌──────┴───────┐            │               │
│         │         │ Docker       │   results/ │               │
│         │         │ Service      │   ├── season-1.csv         │
│         ▼         └──────┬───────┘   ├── tournament-2026-03.csv│
│    entries/              │           └── ...                   │
│    ├── api-go-fiber/     ▼                                    │
│    ├── api-rust-actix/  Docker Engine                         │
│    └── ...              ├── build image                       │
│                         ├── start container                   │
│                         ├── health check                      │
│                         ├── oha benchmark                     │
│                         └── stop + remove                     │
└──────────────────────────────────────────────────────────────┘
```

---

## Backend API

### Entry Management

**GET /api/entries**

Returns all entries scanned from the `entries/` directory with parsed `entry.yaml` metadata.

```typescript
// Response
{
  entries: [
    {
      id: "api-go-fiber",
      framework: "Fiber",
      language: "Go",
      level: "v3",              // "v1", "v2", or "v3"
      version: "2.52.5",
      author: "maintainer",
      path: "entries/api-go-fiber",
      hasDockerfile: true,
      imageExists: boolean,      // has been built
      containerRunning: boolean   // currently running
    }
  ]
}
```

Query params for filtering:
- `?level=v1` — entries at v1 or higher
- `?level=v2` — entries at v2 or higher
- `?level=v3` — only v3 entries
- `?sort=language` or `?sort=framework`

The operator also selects a data size (small, medium, large).

### Container Lifecycle

**POST /api/containers/build**
```json
{ "entryId": "api-go-fiber", "dataSize": "small" }
```
Builds the Docker image for an entry with the specified data tier.

**POST /api/containers/start**
```json
{ "entryId": "api-go-fiber" }
```
Starts the container on an auto-assigned port. Returns the port.

**POST /api/containers/stop**
```json
{ "entryId": "api-go-fiber" }
```
Stops and removes the container.

**POST /api/containers/start-batch**
```json
{ "entryIds": ["api-go-fiber", "api-rust-actix", "api-node-hono"] }
```
Starts multiple containers, each on a unique port. Returns port map.

**POST /api/containers/stop-all**
Stops and removes all tournament-managed containers.

### Benchmarking

**POST /api/benchmark/run**
```json
{
  "entryId": "api-go-fiber",
  "level": "v2",
  "dataSize": "small",
  "mode": "quick",
  "endpoints": ["GET /api/authors", "GET /api/search?keyword=fantasy"]
}
```
Runs a benchmark against a single entry. Full lifecycle: build → start → health check → warmup → benchmark → stop.

- `level`: determines which endpoints are benchmarked.
- `dataSize`: "small", "medium", or "large". Determines which seed SQL is used.
- `mode: "quick"` — 2,000 requests, 20 concurrency
- `mode: "full"` — 20,000 requests, 50 concurrency
- `endpoints`: optional, defaults to all endpoints for the level

Response:
```json
{
  "entryId": "api-go-fiber",
  "timestamp": "2026-03-11T14:30:00Z",
  "mode": "quick",
  "level": "v2",
  "dataSize": "small",
  "startupMs": 147,
  "imageSizeMb": 5,
  "memIdleMib": 4.9,
  "memLoadedMib": 14.6,
  "endpoints": {
    "get_authors": { "reqPerSec": 39208, "avgMs": 1.27, "p50Ms": 1.07, "p95Ms": 2.29, "p99Ms": 3.68 },
    "get_books": { ... },
    "get_author_by_id": { ... },
    "get_book_by_id": { ... },
    "search": { ... },
    "get_author_books": { ... }
  }
}
```

**POST /api/benchmark/run-batch**
```json
{
  "entryIds": ["api-go-fiber", "api-rust-actix", "api-node-hono"],
  "level": "v2",
  "dataSize": "small",
  "mode": "full"
}
```
Runs benchmarks sequentially for multiple entries. Each entry goes through the full lifecycle independently (build → start → benchmark → stop → next entry). Returns an array of results.

**GET /api/benchmark/status**
Returns current benchmark state: idle, building, warming up, benchmarking (entry name, endpoint, progress), or complete.

### Tournament

**POST /api/tournament/create**
```json
{
  "name": "Speed Demon v2 Quick",
  "entryIds": ["api-go-fiber", "api-rust-actix", ...],
  "level": "v2",
  "dataSize": "small",
  "mode": "quick",
  "metric": "throughput",
  "benchmarkEndpoint": "search"
}
```

Creates a tournament bracket. Randomizes entries into the next power-of-2 bracket with random byes. Does NOT start benchmarking — just sets up the bracket structure.

Response:
```json
{
  "tournamentId": "t-2026-03-11-001",
  "name": "Speed Demon v2 Quick",
  "bracketSize": 16,
  "totalEntries": 12,
  "byes": 4,
  "metric": "throughput",
  "rounds": [
    {
      "round": 1,
      "matchups": [
        { "id": "m1", "entry1": "api-go-fiber", "entry2": "api-rust-actix", "winner": null },
        { "id": "m2", "entry1": "api-node-hono", "entry2": null, "winner": "api-node-hono", "bye": true },
        ...
      ]
    },
    { "round": 2, "matchups": [...] },
    { "round": 3, "matchups": [...] },
    { "round": 4, "matchups": [...] }
  ]
}
```

**POST /api/tournament/:id/run-matchup**
```json
{ "matchupId": "m1" }
```
Runs the benchmark for both entries in a matchup (sequentially: build → start → benchmark → stop entry 1, then entry 2). Determines winner based on the tournament metric. Updates the bracket.

Response:
```json
{
  "matchupId": "m1",
  "entry1": { "entryId": "api-go-fiber", "score": 39208 },
  "entry2": { "entryId": "api-rust-actix", "score": 33910 },
  "metric": "throughput",
  "winner": "api-go-fiber"
}
```

**POST /api/tournament/:id/run-round**
```json
{ "round": 1 }
```
Runs all non-bye matchups in a round sequentially. Convenience endpoint for operator mode.

**POST /api/tournament/:id/run-all**
Runs the entire tournament from current state to completion. For operator mode when you just want the final results.

**GET /api/tournament/:id**
Returns current bracket state with all completed matchup results.

### Results

**POST /api/results/save**
```json
{
  "name": "Season 1 - V2 Quick",
  "type": "batch",
  "results": [ ...benchmark results... ]
}
```
Saves results to a CSV file in `results/`. Filename is auto-generated from name and timestamp.

**POST /api/results/save-tournament**
```json
{ "tournamentId": "t-2026-03-11-001" }
```
Saves tournament bracket and all matchup results to CSV.

**GET /api/results**
Lists all saved result files in `results/`.

**GET /api/results/:filename**
Returns parsed contents of a specific results CSV.

---

## Frontend Pages

### Page 1: Operator Mode (`/operator`)

The day-to-day benchmarking control panel. Functional, information-dense, no theatrics.

```
┌─────────────────────────────────────────────────────────────────┐
│  Book API Tournament — Operator Mode            [Tournament] [Results] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Configuration ──────────────────────────────────────────┐  │
│  │ Level: [v2 ▾]   Data Size: [small ▾]                    │  │
│  │ Mode: (•) Quick  ( ) Full                                │  │
│  │ Endpoints: [✓] All  [ ] Custom selection...              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Entry Selection ────────────────────────────────────────┐  │
│  │ Sort by: [Language ▾]        [Select All] [Clear All]    │  │
│  │                                                          │  │
│  │ ☐ C         api-c                    v2                  │  │
│  │ ☐ C++       api-cpp                  v2                  │  │
│  │ ☑ C#        api-csharp-minimal       v3                  │  │
│  │ ☑ C#        api-csharp-webapi        v3                  │  │
│  │ ☐ Clojure   api-clojure-ring-reitit  v2                  │  │
│  │ ☑ Go        api-go-fiber             v3                  │  │
│  │ ☑ Go        api-go-nethttp           v3                  │  │
│  │ ...                                                      │  │
│  │                                                          │  │
│  │ Selected: 4 entries   Eligible: 4 (all match config)     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [ ▶ Run Benchmarks ]                                          │
│                                                                 │
│  ┌─ Progress ───────────────────────────────────────────────┐  │
│  │ ◐ Benchmarking api-go-fiber (3/4)                        │  │
│  │   Building... Starting... Warming up... Running...       │  │
│  │   Endpoint: GET /api/search (4/6)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Results ────────────────────────────────────────────────┐  │
│  │ Framework     │ req/s  │ p99   │ Mem   │ Start │ Image  │  │
│  │ go-fiber      │ 39,208 │ 3.68  │ 14.6  │ 147   │ 5      │  │
│  │ go-nethttp    │ 36,855 │ 4.36  │ 15.5  │ 147   │ 5      │  │
│  │ csharp-min    │ 32,669 │ 4.73  │ 107.7 │ 385   │ 46     │  │
│  │ csharp-webapi │ 29,042 │ 4.76  │ 126.3 │ 304   │ 46     │  │
│  │                                                          │  │
│  │ [ Save Results ]  [ Export CSV ]                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Key behaviors:**
- Changing level filters the entry list to only show eligible entries
- "Run Benchmarks" processes entries sequentially with full container lifecycle
- Progress shows current entry, current endpoint, spinner
- Results table is sortable by any column
- "Save Results" persists to CSV in `results/`

### Page 2: Tournament Mode (`/tournament`)

The presentation mode. Big visuals, dramatic, designed for an audience.

```
┌─────────────────────────────────────────────────────────────────┐
│  🏆 BOOK API TOURNAMENT              [Operator] [Results]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Setup (shown before tournament starts) ─────────────────┐  │
│  │                                                          │  │
│  │ Tournament Name: [Speed Demon - March 2026          ]    │  │
│  │ Level: [v2 ▾]   Data Size: [small ▾]                    │  │
│  │ Mode: (•) Quick  ( ) Full                                │  │
│  │ Winning Metric: [Throughput (req/s) ▾]                   │  │
│  │ Benchmark Endpoint: [GET /api/search ▾]                  │  │
│  │                                                          │  │
│  │ ┌─ Select Entries ─────────────────────────────────┐     │  │
│  │ │ (filtered entry list with checkboxes)            │     │  │
│  │ │ Selected: 12 → Bracket size: 16 (4 byes)        │     │  │
│  │ └─────────────────────────────────────────────────┘     │  │
│  │                                                          │  │
│  │ [ 🎲 Randomize & Create Bracket ]                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Bracket (shown after creation) ─────────────────────────┐  │
│  │                                                          │  │
│  │  Round 1          Quarters       Semis       Final       │  │
│  │                                                          │  │
│  │  go-fiber ──┐                                            │  │
│  │             ├── ? ──┐                                    │  │
│  │  rails ─────┘       │                                    │  │
│  │                     ├── ? ──┐                            │  │
│  │  hono ──────(bye)───┘       │                            │  │
│  │                             ├── ? ──── 🏆               │  │
│  │  actix ─────┐               │                            │  │
│  │             ├── ? ──┐       │                            │  │
│  │  django ────┘       │       │                            │  │
│  │                     ├── ? ──┘                            │  │
│  │  spring ────(bye)───┘                                    │  │
│  │                                                          │  │
│  │  [ ▶ Run Next Matchup ]     Round 1: 0/4 complete       │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Matchup Detail (shown during/after a matchup) ──────────┐  │
│  │                                                          │  │
│  │        go-fiber          vs          rails               │  │
│  │        Go                            Ruby                │  │
│  │                                                          │  │
│  │        ◐ Benchmarking...             Waiting...          │  │
│  │                                                          │  │
│  │   (after both complete:)                                 │  │
│  │                                                          │  │
│  │        39,208 req/s      vs     3,664 req/s              │  │
│  │        ████████████████         ██                        │  │
│  │                                                          │  │
│  │              🏆 WINNER: go-fiber                         │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Key behaviors:**
- Setup panel disappears once bracket is created
- "Randomize & Create Bracket" shuffles entries randomly, assigns byes randomly, builds bracket
- "Run Next Matchup" button triggers the next unresolved matchup
- During a matchup: spinner for each entry as it's being benchmarked
- After both entries complete: scores revealed, visual bar comparison, winner announced
- Winner advances in the bracket visualization (line connects to next round)
- Loser is dimmed/grayed
- Continue clicking "Run Next Matchup" through all rounds to the final
- At the end: champion banner
- "Save Tournament" persists bracket + all scores to CSV

**Metric dropdown options:**
- Throughput (req/s) — higher wins
- p99 Latency (ms) — lower wins
- p95 Latency (ms) — lower wins
- Average Latency (ms) — lower wins
- Memory Under Load (MiB) — lower wins
- Startup Time (ms) — lower wins
- Image Size (MB) — lower wins
- Efficiency (req/s per MiB) — higher wins

### Page 3: Results Viewer (`/results`)

Historical results browser. Read-only, analytical.

```
┌─────────────────────────────────────────────────────────────────┐
│  Results Archive                        [Operator] [Tournament] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Saved Results ──────────────────────────────────────────┐  │
│  │                                                          │  │
│  │ 📊 Season 1 - V2 Full (2026-03-15)          [View]      │  │
│  │ 🏆 Speed Demon Tournament (2026-03-14)       [View]      │  │
│  │ 📊 V1 Micro Smoke Test (2026-03-12)          [View]      │  │
│  │ 🏆 Efficiency Crown Tournament (2026-03-12)   [View]      │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Viewing: Season 1 - V2 Full ────────────────────────────┐  │
│  │                                                          │  │
│  │ Sort by: [Throughput ▾]                                  │  │
│  │                                                          │  │
│  │ Framework      │ Lang   │ req/s  │ p99   │ Mem   │ ...  │  │
│  │ go-fiber       │ Go     │ 39,208 │ 3.68  │ 14.6  │      │  │
│  │ go-nethttp     │ Go     │ 36,855 │ 4.36  │ 15.5  │      │  │
│  │ ...            │        │        │       │       │      │  │
│  │                                                          │  │
│  │ [ Export CSV ]  [ Compare with... ]                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Viewing: Speed Demon Tournament ────────────────────────┐  │
│  │                                                          │  │
│  │  (Bracket visualization with all results filled in)      │  │
│  │  Champion: go-fiber 🏆                                   │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Key behaviors:**
- Lists all CSV files in `results/` directory
- Batch results render as sortable tables
- Tournament results render as completed bracket visualizations
- "Compare with..." lets you overlay two seasons side by side
- Export re-downloads the raw CSV

---

## Container Lifecycle Management

### Port Assignment

Each entry gets a deterministic port: `9000 + index` where index is the alphabetical position in the entries list. This avoids port conflicts when multiple containers run simultaneously.

For sequential benchmarking (the default), only one container runs at a time on a single port (9000). This avoids any resource contention.

For batch startup (if needed), ports are assigned dynamically and tracked in memory.

### Lifecycle Sequence (per entry)

```
1. BUILD     docker build -t tournament-{entryId} entries/{entryId}/
2. START     docker run -d -p {port}:8080 --name tournament-{entryId} tournament-{entryId}
3. HEALTH    Poll GET /api/authors until 200 (timeout: 60s)
4. IDLE MEM  docker stats --no-stream (capture idle memory)
5. WARMUP    oha -n {warmup} -c 10 http://localhost:{port}/api/authors
6. BENCHMARK oha -n {requests} -c {concurrency} http://localhost:{port}/{endpoint}
             (repeat for each endpoint)
7. LOAD MEM  docker stats --no-stream (capture loaded memory)
8. STOP      docker stop tournament-{entryId} && docker rm tournament-{entryId}
```

Startup time is measured as the wall-clock time between step 2 and step 3 completing.

Image size is captured from `docker image inspect` after step 1.

### Resource Protection

Before starting a container, check available system memory. If less than 512 MiB free, refuse to start and surface an error. This prevents OOM situations when running large-dataset benchmarks on constrained machines.

---

## Tournament Bracket Logic

### Bracket Generation

```typescript
function createBracket(entryIds: string[]): Bracket {
  // 1. Shuffle entries randomly
  const shuffled = fisherYatesShuffle(entryIds);

  // 2. Find next power of 2
  const bracketSize = nextPowerOf2(shuffled.length);
  const byeCount = bracketSize - shuffled.length;

  // 3. Create first round matchups
  // Fill bracket slots: entries fill from slot 0 up, byes are assigned randomly
  // among the matchup positions
  const slots: (string | null)[] = new Array(bracketSize).fill(null);

  // Place entries
  for (let i = 0; i < shuffled.length; i++) {
    slots[i] = shuffled[i];
  }

  // Remaining null slots are byes — shuffle slot assignments so byes are random
  const allSlots = fisherYatesShuffle(
    slots.map((entry, i) => ({ entry, index: i }))
  );

  // Pair into matchups
  const round1: Matchup[] = [];
  for (let i = 0; i < bracketSize; i += 2) {
    const entry1 = allSlots[i].entry;
    const entry2 = allSlots[i + 1].entry;
    const isBye = entry1 === null || entry2 === null;
    round1.push({
      id: `r1-m${round1.length + 1}`,
      entry1, entry2,
      winner: isBye ? (entry1 || entry2) : null,
      bye: isBye
    });
  }

  // 4. Build subsequent rounds (empty, to be filled as tournament progresses)
  const totalRounds = Math.log2(bracketSize);
  const rounds: Round[] = [{ round: 1, matchups: round1 }];
  for (let r = 2; r <= totalRounds; r++) {
    const matchupCount = bracketSize / Math.pow(2, r);
    const matchups: Matchup[] = Array.from({ length: matchupCount }, (_, i) => ({
      id: `r${r}-m${i + 1}`,
      entry1: null, entry2: null, winner: null, bye: false
    }));
    rounds.push({ round: r, matchups });
  }

  return { bracketSize, totalRounds, rounds };
}
```

### Matchup Resolution

When a matchup is triggered:

1. Build and benchmark entry1 (full lifecycle)
2. Build and benchmark entry2 (full lifecycle)
3. Extract the tournament's chosen metric from both results
4. Higher or lower wins (depending on metric type)
5. Winner's `entryId` is written into the matchup
6. Winner advances to the next round's corresponding matchup slot
7. If the next round's matchup now has both entries, it becomes runnable

### Advancing Winners

After matchup `r1-m1` and `r1-m2` resolve, their winners populate `r2-m1`:
- Winner of `r1-m1` → `r2-m1.entry1`
- Winner of `r1-m2` → `r2-m1.entry2`

This continues until the final round has two entries and one matchup.

---

## Results Persistence

### CSV Format — Batch Results

```csv
timestamp,name,entryId,language,framework,level,dataSize,mode,endpoint,reqPerSec,avgMs,p50Ms,p95Ms,p99Ms,startupMs,memIdleMib,memLoadedMib,imageSizeMb
2026-03-11T14:30:00Z,Season 1,api-go-fiber,Go,Fiber,v2,small,full,get_authors,39208,1.27,1.07,2.29,3.68,147,4.9,14.6,5
2026-03-11T14:30:00Z,Season 1,api-go-fiber,Go,Fiber,v2,small,full,search,38500,1.31,1.10,2.35,3.72,147,4.9,14.6,5
```

One row per entry per endpoint. Startup, memory, and image size are repeated on each row for that entry (denormalized for easy analysis).

### CSV Format — Tournament Results

```csv
timestamp,tournamentName,metric,level,dataSize,mode,round,matchupId,entry1,entry2,entry1Score,entry2Score,winner,bye
2026-03-11T15:00:00Z,Speed Demon March,throughput,v2,small,quick,1,r1-m1,api-go-fiber,api-ruby-rails,39208,3664,api-go-fiber,false
2026-03-11T15:00:00Z,Speed Demon March,throughput,v2,small,quick,1,r1-m2,api-node-hono,,31274,,api-node-hono,true
```

One row per matchup. Byes have empty entry2 and entry2Score.

### File Naming

- Batch: `results/batch-{name}-{YYYY-MM-DD-HHmmss}.csv`
- Tournament: `results/tournament-{name}-{YYYY-MM-DD-HHmmss}.csv`

All files are gitignored until explicitly saved, then the user commits them to the repo.

---

## Benchmark Modes

### Quick Mode
- **Requests:** 2,000 per endpoint
- **Concurrency:** 20
- **Warmup:** 500 requests
- **Approximate time per entry:** 10-20 seconds
- **Use case:** Smoke tests, tournament matchups, interactive exploration

### Full Mode
- **Requests:** 20,000 per endpoint
- **Concurrency:** 50
- **Warmup:** 2,000 requests
- **Approximate time per entry:** 60-120 seconds
- **Use case:** Official season results, publication-quality data

---

## Implementation Phases

### Phase A: Backend Core
- [ ] Hono server scaffolding
- [ ] Entry scanner (read entries/ directory, parse entry.yaml)
- [ ] Docker service (build, start, stop, health check, stats via dockerode)
- [ ] Benchmark runner (spawn oha/hey as child process, parse output)
- [ ] Results store (write/read CSV files)
- [ ] All REST endpoints wired up

### Phase B: Operator Page
- [ ] Entry selector with level filtering and data size selection
- [ ] Ineligible entries grayed out with explanation
- [ ] Benchmark configuration panel (level, data size, mode)
- [ ] Run button with progress spinner
- [ ] Results table (sortable)
- [ ] Save and export functionality

### Phase C: Tournament Page
- [ ] Tournament setup panel (metric selector, entry selection)
- [ ] Bracket generator (randomize, power-of-2, random byes)
- [ ] Bracket visualization (CSS grid or flexbox)
- [ ] "Run Next Matchup" button with spinner
- [ ] Matchup detail card (head-to-head scores, winner reveal)
- [ ] Winner advancement in bracket
- [ ] Champion banner
- [ ] Save tournament results

### Phase D: Results Page
- [ ] List saved CSV files
- [ ] Render batch results as sortable tables
- [ ] Render tournament results as completed brackets
- [ ] Export functionality

### Phase E: Polish
- [ ] Dark theme for presentation mode
- [ ] Keyboard shortcuts (→ next matchup, R reset, F fullscreen)
- [ ] Error handling and recovery (container crashes, benchmark failures)
- [ ] Responsive layout
- [ ] Tool detection (oha/hey/docker availability check on startup)
