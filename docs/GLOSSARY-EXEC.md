# Glossary Tooltip System — Execution Summary

## Status: COMPLETE (core system + initial integration)

The glossary tooltip system is implemented and wired into the Control Center UI. Technical terms show a dotted underline and reveal a plain-English tooltip on hover, with optional expandable technical detail and "why it matters" context.

---

## Files Created

| # | File | Purpose |
|---|------|---------|
| 1 | src/shared/glossary.ts | 30 glossary entries: performance metrics, resource metrics, architecture concepts, benchmark/tournament concepts, levels |
| 2 | src/client/components/GlossaryTerm.tsx | Reusable tooltip component with above/below positioning, `<details>` for technical info, optional unit display |
| 3 | src/client/styles/glossary.css | Dark-themed tooltip styling: dotted underline, positioned tooltip with arrow, sections for plain/technical/matters |

## Files Modified

| # | File | Change |
|---|------|--------|
| 1 | src/client/main.tsx | Added `import "./styles/glossary.css"` |
| 2 | src/client/components/ResultsTable.tsx | Wrapped column headers: Startup, Image, Mem Idle, Mem Load, req/s, avg, p50, p95, p99 |
| 3 | src/client/components/BenchmarkConfig.tsx | Wrapped Quick/Full mode radio labels |
| 4 | src/client/components/MatchupCard.tsx | Wrapped metric label in matchup header |
| 5 | src/client/components/BracketView.tsx | Wrapped "BYE" labels in bracket slots |
| 6 | src/client/pages/LandingPage.tsx | Wrapped level badges (hardcoded, v1, v2, v3) in entries overview |
| 7 | src/client/pages/TournamentPage.tsx | Wrapped level display in tournament info bar |

---

## Glossary Entries (30 terms)

### Performance Metrics (7)
throughput, req/s, latency, p50, p95, p99, average latency

### Resource Metrics (6)
memory, idle memory, loaded memory, MiB, startup time, image size

### Derived Metrics (1)
efficiency

### Architecture Concepts (6)
event loop, thread-per-request, virtual threads, coroutines, GIL, CGI

### Database (1)
SQLite

### Benchmark Concepts (4)
concurrency, warmup, quick mode, full mode

### Tournament Concepts (3)
bye, bracket, single elimination

### Levels (4)
hardcoded, v1, v2, v3

---

## Build Verification

- TypeScript: `tsc --noEmit` passes with zero errors
- Vite: `vite build` succeeds (49 modules, ~209KB JS)

---

## What Still Needs Doing

### More integration points

The glossary component exists and works, but only a subset of UI locations have been annotated. Terms that could still be wrapped with `<GlossaryTerm>`:

- **TournamentPage setup form**: the metric dropdown options (throughput, p99, efficiency, etc.) — these are in a `<select>` so wrapping individual `<option>` elements isn't straightforward. Could add a description line below the dropdown showing the selected metric's glossary definition.
- **OperatorPage progress panel**: terms like "Building", "Warming up" could link to glossary entries for warmup, Docker image, etc.
- **Presentation/talk mode**: if the app is used during a live presentation, a "glossary sidebar" or "glossary overlay" could show all terms at once for the audience.

### Architecture terms not yet surfaced in UI

The glossary includes entries for event loop, thread-per-request, virtual threads, coroutines, GIL, and CGI, but these don't appear anywhere in the current UI. They would be useful if:

- Entry cards or detail views show the concurrency model of each framework
- A comparison view explains *why* certain frameworks are faster
- The tournament results page includes commentary

### Possible enhancements

- **Click to pin**: clicking a tooltip could pin it open so users can read the technical detail without keeping the mouse perfectly still.
- **Glossary page**: a dedicated `/glossary` route that lists all terms alphabetically — useful as a standalone reference.
- **Tooltip edge detection**: currently only checks top-of-viewport for above/below. Could also handle left/right edge cases for terms near the edge of the screen.
