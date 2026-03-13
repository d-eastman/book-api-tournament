// Entry metadata from entry.yaml
export interface Entry {
  id: string;                    // directory name, e.g. "api-go-fiber"
  framework: string;
  language: string;
  version: string;
  author: string;
  level: "hardcoded" | "v1" | "v2" | "v3";
  repo?: string;
  notes?: string;
  path: string;                  // relative path from repo root
  hasDockerfile: boolean;
  imageExists?: boolean;
  containerRunning?: boolean;
}

// Benchmark configuration
export interface BenchmarkConfig {
  level: "hardcoded" | "v1" | "v2" | "v3";
  dataSize: "hardcoded" | "small" | "medium" | "large";
  mode: "quick" | "full";
  endpoints?: string[];
}

// Per-endpoint benchmark result
export interface EndpointResult {
  endpoint: string;
  reqPerSec: number;
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
}

// Full benchmark result for one entry
export interface BenchmarkResult {
  entryId: string;
  timestamp: string;
  mode: "quick" | "full";
  level: string;
  dataSize: string;
  startupMs: number;
  imageSizeMb: number;
  memIdleMib: number;
  memLoadedMib: number;
  endpoints: Record<string, EndpointResult>;
}

// Benchmark status (for polling)
export type BenchmarkStatus =
  | { state: "idle" }
  | { state: "building"; entryId: string }
  | { state: "starting"; entryId: string }
  | { state: "warming"; entryId: string }
  | { state: "benchmarking"; entryId: string; endpoint: string; progress: string }
  | { state: "complete"; results: BenchmarkResult[] };

// Tournament types
export interface Matchup {
  id: string;
  entry1: string | null;
  entry2: string | null;
  entry1Score?: number;
  entry2Score?: number;
  winner: string | null;
  bye: boolean;
}

export interface Round {
  round: number;
  matchups: Matchup[];
}

export interface Tournament {
  id: string;
  name: string;
  level: string;
  dataSize: string;
  mode: "quick" | "full";
  metric: string;
  benchmarkEndpoint: string;
  bracketSize: number;
  totalEntries: number;
  byes: number;
  rounds: Round[];
  champion?: string;
  createdAt: string;
}

export interface MatchupResult {
  matchupId: string;
  entry1: { entryId: string; score: number };
  entry2: { entryId: string; score: number };
  metric: string;
  winner: string;
}

// Metric options for tournaments
export interface MetricOption {
  value: string;
  label: string;
  higherWins: boolean;
}

export const METRIC_OPTIONS: MetricOption[] = [
  { value: "throughput", label: "Throughput (req/s)", higherWins: true },
  { value: "p99", label: "p99 Latency (ms)", higherWins: false },
  { value: "p95", label: "p95 Latency (ms)", higherWins: false },
  { value: "avgLatency", label: "Average Latency (ms)", higherWins: false },
  { value: "memory", label: "Memory Under Load (MiB)", higherWins: false },
  { value: "startup", label: "Startup Time (ms)", higherWins: false },
  { value: "imageSize", label: "Image Size (MB)", higherWins: false },
  { value: "efficiency", label: "Efficiency (req/s per MiB)", higherWins: true },
];

// Endpoints benchmarked per level
export const ENDPOINTS_BY_LEVEL: Record<string, string[]> = {
  hardcoded: [
    "GET /api/authors",
    "GET /api/books",
    "GET /api/authors/1",
    "GET /api/books/1",
  ],
  v1: [
    "GET /api/authors",
    "GET /api/books",
    "GET /api/authors/1",
    "GET /api/books/1",
  ],
  v2: [
    "GET /api/authors",
    "GET /api/books",
    "GET /api/authors/1",
    "GET /api/books/1",
    "GET /api/search?keyword=fantasy",
    "GET /api/authors/1/books",
  ],
  v3: [
    "GET /api/authors",
    "GET /api/books",
    "GET /api/authors/1",
    "GET /api/books/1",
    "GET /api/search?keyword=fantasy",
    "GET /api/authors/1/books",
    "POST /api/books",
    "GET /api/stats",
  ],
};

// Saved result file metadata
export interface SavedResult {
  filename: string;
  type: "batch" | "tournament";
  name: string;
  date: string;
}
