# Phase 3 (Control Center App) — Implementation Plan

## Goal

Build the Benchmark Control Center — a local web app (Hono backend + React frontend) for running benchmarks, managing tournaments, and viewing results across all Book API Tournament entries. After this phase, the maintainer can scan entries, run benchmarks via Docker, execute tournament brackets, and view/save results.

## Prerequisites

- [x] Phase A–2c complete (6 entries at v3 with full spec compliance)
- [x] control-center/CONTROL-CENTER.md written (full architecture doc)
- [ ] Docker installed and running
- [ ] oha or hey benchmark tool installed

## Architecture Summary

- **Backend:** Hono on Node.js (port 3001)
- **Frontend:** React + TypeScript + Vite + Tailwind CSS (port 5173, proxied to backend)
- **Docker:** Managed via dockerode (npm)
- **Benchmark:** oha or hey spawned as child processes
- **Results:** CSV files in `results/`

## Deliverables

### Backend (Hono)

| # | File | Purpose |
|---|------|---------|
| 1 | src/server/index.ts | Hono server entry point, mounts all routes |
| 2 | src/server/routes/entries.ts | GET /api/entries — scan entries/, parse entry.yaml |
| 3 | src/server/routes/containers.ts | POST /api/containers/{build,start,stop} — Docker lifecycle |
| 4 | src/server/routes/benchmark.ts | POST /api/benchmark/run — run benchmarks, GET status |
| 5 | src/server/routes/tournament.ts | POST /api/tournament/create, run-matchup, run-round |
| 6 | src/server/routes/results.ts | GET/POST /api/results — read/write CSV files |
| 7 | src/server/services/entry-scanner.ts | Scan entries/ dir, parse entry.yaml files |
| 8 | src/server/services/docker.ts | Docker container lifecycle via dockerode |
| 9 | src/server/services/benchmark-runner.ts | Spawn oha/hey, parse output |
| 10 | src/server/services/bracket-generator.ts | Tournament bracket logic |
| 11 | src/server/services/results-store.ts | Read/write CSV files |
| 12 | src/server/types.ts | Server-side types |

### Frontend (React)

| # | File | Purpose |
|---|------|---------|
| 13 | src/client/main.tsx | React entry point |
| 14 | src/client/App.tsx | Router with nav (Operator, Tournament, Results) |
| 15 | src/client/pages/OperatorPage.tsx | Batch benchmark control panel |
| 16 | src/client/pages/TournamentPage.tsx | Live bracket tournament |
| 17 | src/client/pages/ResultsPage.tsx | Historical results viewer |
| 18 | src/client/components/EntrySelector.tsx | Filterable entry picker with checkboxes |
| 19 | src/client/components/BenchmarkConfig.tsx | Level, data size, mode selection |
| 20 | src/client/components/ResultsTable.tsx | Sortable benchmark results table |
| 21 | src/client/components/BracketView.tsx | Tournament bracket visualization |
| 22 | src/client/components/MatchupCard.tsx | Head-to-head comparison card |
| 23 | src/client/lib/api.ts | HTTP client for backend |
| 24 | src/client/lib/colors.ts | Language color map |

### Shared

| # | File | Purpose |
|---|------|---------|
| 25 | src/shared/types.ts | Types shared between server and client |

### Config

| # | File | Purpose |
|---|------|---------|
| 26 | package.json | Dependencies, scripts (dev, build, start) |
| 27 | tsconfig.json | TypeScript config |
| 28 | vite.config.ts | Vite config with proxy to backend |
| 29 | tailwind.config.js | Tailwind config |
| 30 | postcss.config.js | PostCSS for Tailwind |
| 31 | index.html | Vite HTML entry point |

## Detailed Implementation

### Backend Services

#### entry-scanner.ts
- Scan `../entries/` directory for `api-*` subdirs
- Parse `entry.yaml` (using js-yaml) from each entry
- Check for `Dockerfile` presence
- Return list of Entry objects with metadata

#### docker.ts
- Use `dockerode` to build images, start/stop containers
- Health check: poll GET /api/authors until 200 (timeout 60s)
- Capture idle/loaded memory via `docker stats`
- Capture image size via `docker inspect`
- Capture startup time (wall clock from run to health check pass)

#### benchmark-runner.ts
- Detect available tool: `oha` preferred, fall back to `hey`
- Spawn as child process with appropriate args
- Parse JSON output (oha --json) or text output (hey)
- Extract: req/s, avg latency, p50, p95, p99
- Full lifecycle: build → start → health → warmup → benchmark endpoints → capture memory → stop

#### bracket-generator.ts
- Fisher-Yates shuffle for randomization
- Next power of 2 for bracket size
- Random bye assignment
- Build round structure
- Matchup resolution and winner advancement

#### results-store.ts
- Write batch results to CSV (one row per entry per endpoint)
- Write tournament results to CSV (one row per matchup)
- Read and parse CSV files from `results/`
- List available result files

### Frontend Pages

#### OperatorPage
1. BenchmarkConfig: level dropdown, data size dropdown (hidden for Hardcoded), mode radio
2. EntrySelector: checkboxes, filtered by level, sortable by language/framework
3. Run button → POST /api/benchmark/run-batch → poll status → show progress
4. ResultsTable: sortable columns for all metrics
5. Save/Export buttons

#### TournamentPage
1. Setup panel: name, config, metric dropdown, endpoint dropdown, entry selection
2. Create bracket button → POST /api/tournament/create
3. BracketView: visual bracket with connectors
4. Run Next Matchup → POST /api/tournament/:id/run-matchup
5. MatchupCard: head-to-head scores, visual bar comparison, winner reveal
6. Champion banner at completion

#### ResultsPage
1. List saved CSV files from GET /api/results
2. Click to view: batch as sortable table, tournament as bracket
3. Export button to download CSV

## Execution Order

```
[1. Config/scaffolding] ──→ [2. Shared types] ──→ [3. Backend services] ──→ [4. Backend routes]
                                                                                     │
                                                                              [5. Frontend scaffolding]
                                                                                     │
                                                          [6. Components] ──→ [7. Pages] ──→ [8. Integration]
```

Steps 1-4 (backend) and 5-7 (frontend) can largely proceed in parallel once shared types exist.

## Key Design Decisions

1. **Sequential benchmarking only** — One container at a time to avoid resource contention
2. **Port 9000** for benchmark containers (single port, sequential use)
3. **oha preferred over hey** — better JSON output, more metrics
4. **CSV for results** — no database dependency, git-friendly, easy to analyze
5. **Vite proxy** — frontend dev server proxies `/api` to Hono backend at port 3001
6. **Dark theme** — Tailwind dark mode for presentation (tournament page)

## Success Criteria

1. `npm run dev` starts both backend (3001) and frontend (5173)
2. GET /api/entries returns all 6 entries with correct metadata
3. Operator page shows entries filtered by level
4. Benchmark can be triggered and results displayed (requires Docker + oha/hey)
5. Tournament bracket can be created and visualized
6. Results can be saved to CSV and viewed later
