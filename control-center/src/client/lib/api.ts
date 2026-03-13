import type {
  Entry,
  BenchmarkConfig,
  BenchmarkResult,
  BenchmarkStatus,
  Tournament,
  MatchupResult,
  SavedResult,
} from "@shared/types";

const BASE = "/api";

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body}`);
  }
  return res.json();
}

// Entries
export async function getEntries(level?: string): Promise<Entry[]> {
  const q = level ? `?level=${level}` : "";
  const res = await json<{ entries: Entry[] }>(`/entries${q}`);
  return res.entries;
}

// Containers
export function buildContainer(entryId: string) {
  return json("/containers/build", {
    method: "POST",
    body: JSON.stringify({ entryId }),
  });
}

export function startContainer(entryId: string, dataSize = "small") {
  return json("/containers/start", {
    method: "POST",
    body: JSON.stringify({ entryId, dataSize }),
  });
}

export function stopContainer(entryId: string) {
  return json("/containers/stop", {
    method: "POST",
    body: JSON.stringify({ entryId }),
  });
}

export function stopAllContainers() {
  return json("/containers/stop-all", { method: "POST" });
}

// Benchmark
export function runBenchmark(entryId: string, config: BenchmarkConfig) {
  return json("/benchmark/run", {
    method: "POST",
    body: JSON.stringify({ entryId, config }),
  });
}

export function runBatchBenchmark(entryIds: string[], config: BenchmarkConfig) {
  return json("/benchmark/run-batch", {
    method: "POST",
    body: JSON.stringify({ entryIds, config }),
  });
}

export function getBenchmarkStatus(): Promise<BenchmarkStatus> {
  return json("/benchmark/status");
}

export function resetBenchmark() {
  return json("/benchmark/reset", { method: "POST" });
}

// Tournament
export function createTournament(params: {
  name: string;
  level: string;
  dataSize: string;
  mode: "quick" | "full";
  metric: string;
  benchmarkEndpoint: string;
  entryIds: string[];
}): Promise<Tournament> {
  return json("/tournament/create", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function getTournament(id: string): Promise<Tournament> {
  return json(`/tournament/${id}`);
}

export function listTournaments(): Promise<Tournament[]> {
  return json("/tournament");
}

export function runMatchup(
  tournamentId: string,
  matchupId: string
): Promise<MatchupResult> {
  return json(`/tournament/${tournamentId}/run-matchup`, {
    method: "POST",
    body: JSON.stringify({ matchupId }),
  });
}

export function getNextMatchup(
  tournamentId: string
): Promise<{ matchupId: string; round: number } | null> {
  return json(`/tournament/${tournamentId}/next`);
}

// Results
export async function listResults(): Promise<SavedResult[]> {
  const res = await json<{ results: SavedResult[] }>("/results");
  return res.results;
}

export function getResult(
  filename: string
): Promise<{ filename: string; data: Record<string, unknown>[] }> {
  return json(`/results/${filename}`);
}

export function saveBatchResults(
  name: string,
  results: BenchmarkResult[]
): Promise<{ filename: string }> {
  return json("/results/batch", {
    method: "POST",
    body: JSON.stringify({ name, results }),
  });
}

export function saveTournamentResults(
  tournament: Tournament
): Promise<{ filename: string }> {
  return json("/results/tournament", {
    method: "POST",
    body: JSON.stringify({ tournament }),
  });
}
