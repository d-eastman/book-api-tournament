# GLOSSARY.md — Tooltip Glossary System

## Overview

Every technical term in the Control Center UI has a hoverable tooltip that explains it in plain English. The goal is to make the dashboard accessible to junior engineers, non-engineering stakeholders, and anyone who wanders by during a presentation — without dumbing down the interface for experts.

Terms are underlined with a subtle dotted line. Hovering reveals a tooltip with a plain-English definition, and optionally a "why it matters" sentence that connects the concept to real-world impact.

---

## The Glossary Data

All definitions live in a single file: `src/shared/glossary.ts`. Each entry has a term, a plain-English definition, an optional technical definition for experts, and an optional "why it matters" sentence.

```typescript
// src/shared/glossary.ts

export interface GlossaryEntry {
  term: string;           // The word or phrase as it appears in the UI
  plain: string;          // 1-sentence plain English explanation
  technical?: string;     // Optional deeper explanation for curious people
  matters?: string;       // Optional "why should I care?" sentence
  unit?: string;          // Optional unit label (ms, MiB, req/s, etc.)
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

  // ── Benchmark Concepts ───────────────────────────────

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

  // ── Level Concepts ───────────────────────────────────

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
```

---

## The Tooltip Component

A reusable React component that wraps any term and shows its glossary tooltip on hover.

```tsx
// src/client/components/GlossaryTerm.tsx

import { useState, useRef, useEffect } from "react";
import { GLOSSARY, GlossaryEntry } from "../../shared/glossary";

interface Props {
  term: string;           // Key into GLOSSARY
  children?: React.ReactNode;  // Optional custom display text
  showUnit?: boolean;     // Show the unit after the value
}

export function GlossaryTerm({ term, children, showUnit }: Props) {
  const entry = GLOSSARY[term.toLowerCase()];
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState<"above" | "below">("above");
  const ref = useRef<HTMLSpanElement>(null);

  if (!entry) {
    // Term not in glossary — render children without tooltip
    return <>{children ?? term}</>;
  }

  // Determine tooltip position based on viewport space
  useEffect(() => {
    if (show && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPosition(rect.top < 200 ? "below" : "above");
    }
  }, [show]);

  return (
    <span
      ref={ref}
      className="glossary-term"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      role="term"
      aria-describedby={show ? `glossary-${term}` : undefined}
    >
      {children ?? entry.term}
      {showUnit && entry.unit && (
        <span className="glossary-unit"> ({entry.unit})</span>
      )}

      {show && (
        <div
          id={`glossary-${term}`}
          className={`glossary-tooltip glossary-tooltip--${position}`}
          role="tooltip"
        >
          <div className="glossary-tooltip__plain">{entry.plain}</div>

          {entry.technical && (
            <details className="glossary-tooltip__technical">
              <summary>Technical detail</summary>
              <p>{entry.technical}</p>
            </details>
          )}

          {entry.matters && (
            <div className="glossary-tooltip__matters">
              💡 {entry.matters}
            </div>
          )}
        </div>
      )}
    </span>
  );
}
```

---

## Styling

```css
/* src/client/styles/glossary.css */

.glossary-term {
  position: relative;
  cursor: help;
  border-bottom: 1px dotted currentColor;
  opacity: 0.95;
}

.glossary-term:hover {
  opacity: 1;
}

.glossary-unit {
  font-size: 0.85em;
  opacity: 0.7;
}

/* Tooltip container */
.glossary-tooltip {
  position: absolute;
  z-index: 1000;
  width: 320px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
  pointer-events: auto;

  /* Light theme */
  background: #ffffff;
  border: 1px solid #e0e0e0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  color: #333;
}

[data-theme="dark"] .glossary-tooltip {
  background: #2a2a4a;
  border-color: #3a3a5a;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  color: #e0e0e0;
}

/* Position variants */
.glossary-tooltip--above {
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
}

.glossary-tooltip--below {
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
}

/* Arrow */
.glossary-tooltip--above::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: #ffffff;
}

[data-theme="dark"] .glossary-tooltip--above::after {
  border-top-color: #2a2a4a;
}

.glossary-tooltip--below::after {
  content: "";
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-bottom-color: #ffffff;
}

[data-theme="dark"] .glossary-tooltip--below::after {
  border-bottom-color: #2a2a4a;
}

/* Sections within tooltip */
.glossary-tooltip__plain {
  margin-bottom: 8px;
  font-weight: 500;
}

.glossary-tooltip__technical {
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.85;
}

.glossary-tooltip__technical summary {
  cursor: pointer;
  color: #6b7280;
  font-style: italic;
}

.glossary-tooltip__technical summary:hover {
  color: inherit;
}

.glossary-tooltip__technical p {
  margin-top: 4px;
  padding-left: 8px;
  border-left: 2px solid #e0e0e0;
}

[data-theme="dark"] .glossary-tooltip__technical p {
  border-left-color: #3a3a5a;
}

.glossary-tooltip__matters {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
  font-size: 12px;
  font-style: italic;
  opacity: 0.9;
}

[data-theme="dark"] .glossary-tooltip__matters {
  border-top-color: #3a3a5a;
}
```

---

## Usage Examples

### In metric labels

```tsx
// Results table header
<th>
  <GlossaryTerm term="throughput">Throughput</GlossaryTerm>
</th>
<th>
  <GlossaryTerm term="p99">p99</GlossaryTerm>
</th>
<th>
  <GlossaryTerm term="loaded memory">Memory</GlossaryTerm>
</th>
```

### In metric values with units

```tsx
// Results table cell
<td>
  39,208 <GlossaryTerm term="req/s" showUnit>req/s</GlossaryTerm>
</td>
```

### In explanatory text

```tsx
<p>
  This tournament measures <GlossaryTerm term="throughput" /> — the
  number of requests each framework can handle per second. The API
  runs on <GlossaryTerm term="SQLite" /> with the small dataset.
  Each matchup uses <GlossaryTerm term="quick mode" />.
</p>
```

### In the tournament setup panel

```tsx
<label>
  <GlossaryTerm term="concurrency">Concurrency</GlossaryTerm>:
  {mode === "quick" ? "20" : "50"}
</label>
```

### In the bracket — level badges

```tsx
<span className="level-badge">
  <GlossaryTerm term="v2">v2</GlossaryTerm>
</span>
```

---

## Design Principles

**Don't over-annotate.** Not every word needs a tooltip. Only annotate terms that a smart non-expert might not know: p99, throughput, MiB, GIL, event loop, virtual threads. Don't annotate "API", "server", "database", or "framework" — those are common enough.

**Plain English first, technical second.** The plain definition should be understandable by anyone. The technical detail is behind a `<details>` disclosure — visible only if the reader clicks "Technical detail." This respects both audiences.

**"Why it matters" connects to money.** Whenever possible, the matters field ties the concept to something concrete: infrastructure cost, user experience, deployment speed, hiring. Engineers who understand the business impact of technical decisions are the ones who get promoted.

**Consistent voice.** All definitions should feel like they were written by the same person — informal, direct, no jargon in the jargon definitions. "Think of it as..." and "Like a..." analogies are good. "In accordance with the HTTP specification..." is bad.

**Keep tooltips short.** The plain definition is one sentence. Two at most. If you need more, it goes in the technical detail. A tooltip that requires scrolling has failed.

---

## Adding New Terms

When adding a new term:

1. Add the entry to `GLOSSARY` in `src/shared/glossary.ts`
2. Write the `plain` field first — if you can't explain it in one sentence, simplify
3. Add `technical` only if there's genuinely useful deeper context
4. Add `matters` only if there's a concrete business or user impact
5. Add `unit` if the term has a standard unit of measurement
6. Use `<GlossaryTerm term="your-term">` in the relevant UI components
