import { useState, useEffect, useCallback } from "react";
import type { Entry, Tournament } from "@shared/types";
import { METRIC_OPTIONS, BENCHMARK_ENDPOINTS } from "@shared/types";
import { EntrySelector } from "../components/EntrySelector";
import { BracketView } from "../components/BracketView";
import { MatchupCard } from "../components/MatchupCard";
import { GlossaryTerm } from "../components/GlossaryTerm";
import * as api from "../lib/api";

type Phase = "setup" | "bracket" | "running";

export function TournamentPage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Setup form
  const [name, setName] = useState("Tournament");
  const [dataSize, setDataSize] = useState("small");
  const [mode, setMode] = useState<"quick" | "full">("quick");
  const [metric, setMetric] = useState("throughput");
  const [benchEndpoint, setBenchEndpoint] = useState("all");

  // Tournament state
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [nextMatchupId, setNextMatchupId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    entry1: { id: string; language: string; framework: string; score: number };
    entry2: { id: string; language: string; framework: string; score: number };
    winner: string;
  } | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entryMap = new Map(
    entries.map((e) => [
      e.id,
      { language: e.language, framework: e.framework },
    ])
  );

  useEffect(() => {
    api.getEntries().then(setEntries).catch(console.error);
  }, []);

  const toggleEntry = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const createTournament = async () => {
    if (selected.size < 2) return;
    setError(null);
    try {
      const t = await api.createTournament({
        name,
        dataSize,
        mode,
        metric,
        benchmarkEndpoint: benchEndpoint,
        entryIds: Array.from(selected),
      });
      setTournament(t);
      setPhase("bracket");
      fetchNext(t.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create tournament");
    }
  };

  const fetchNext = useCallback(async (id: string) => {
    try {
      const next = await api.getNextMatchup(id);
      setNextMatchupId(next?.matchupId ?? null);
    } catch {
      setNextMatchupId(null);
    }
  }, []);

  const runMatchup = async (matchupId: string) => {
    if (!tournament || running) return;
    setRunning(true);
    setLastResult(null);
    setError(null);
    try {
      const result = await api.runMatchup(tournament.id, matchupId);
      const e1 = entryMap.get(result.entry1.entryId);
      const e2 = entryMap.get(result.entry2.entryId);
      setLastResult({
        entry1: {
          id: result.entry1.entryId,
          language: e1?.language ?? "",
          framework: e1?.framework ?? "",
          score: result.entry1.score,
        },
        entry2: {
          id: result.entry2.entryId,
          language: e2?.language ?? "",
          framework: e2?.framework ?? "",
          score: result.entry2.score,
        },
        winner: result.winner,
      });
      // Refresh tournament
      const updated = await api.getTournament(tournament.id);
      setTournament(updated);
      fetchNext(tournament.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Matchup failed");
    } finally {
      setRunning(false);
    }
  };

  const saveTournament = async () => {
    if (!tournament) return;
    try {
      const { filename } = await api.saveTournamentResults(tournament);
      alert(`Saved as ${filename}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const metricInfo = METRIC_OPTIONS.find((m) => m.value === metric);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Tournament</h1>

      {phase === "setup" && (
        <>
          {/* Setup form */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-4">
            <h2 className="text-sm font-medium text-gray-400">Setup</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Data Size</label>
                <select
                  value={dataSize}
                  onChange={(e) => setDataSize(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100"
                >
                  <option value="small">Small (8a/16b)</option>
                  <option value="medium">Medium (100a/1Kb)</option>
                  <option value="large">Large (500a/50Kb)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as "quick" | "full")}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100"
                >
                  <option value="quick">Quick</option>
                  <option value="full">Full</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Metric</label>
                <select
                  value={metric}
                  onChange={(e) => setMetric(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100"
                >
                  {METRIC_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Endpoint</label>
                <select
                  value={benchEndpoint}
                  onChange={(e) => setBenchEndpoint(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100"
                >
                  <option value="all">
                    All endpoints ({BENCHMARK_ENDPOINTS.length})
                  </option>
                  {BENCHMARK_ENDPOINTS.map((ep) => (
                    <option key={ep} value={ep}>
                      {ep}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Entry selection */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-sm font-medium text-gray-400 mb-3">
              Select Entries (min 2)
            </h2>
            <EntrySelector
              entries={entries}
              selected={selected}
              onToggle={toggleEntry}
              onSelectAll={() =>
                setSelected(new Set(entries.map((e) => e.id)))
              }
              onSelectNone={() => setSelected(new Set())}
            />
          </div>

          <button
            onClick={createTournament}
            disabled={selected.size < 2}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded font-medium text-sm transition"
          >
            Create Tournament ({selected.size} entries)
          </button>
        </>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {tournament && phase !== "setup" && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-200">
                {tournament.name}
              </h2>
              <p className="text-sm text-gray-500">
                {tournament.totalEntries} entries |{" "}
                {tournament.dataSize} | {metricInfo?.label}
              </p>
            </div>
            <div className="flex gap-3">
              {tournament.champion && (
                <button
                  onClick={saveTournament}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Save Results
                </button>
              )}
              <button
                onClick={() => {
                  setPhase("setup");
                  setTournament(null);
                  setLastResult(null);
                }}
                className="text-sm text-gray-400 hover:text-gray-300"
              >
                New Tournament
              </button>
            </div>
          </div>

          {/* Bracket */}
          <div className="bg-gray-800 rounded-lg p-4">
            <BracketView
              tournament={tournament}
              entries={entryMap}
              onRunMatchup={runMatchup}
              nextMatchupId={nextMatchupId}
            />
          </div>

          {/* Last matchup result */}
          {lastResult && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">
                Last Matchup
              </h3>
              <MatchupCard
                entry1={lastResult.entry1}
                entry2={lastResult.entry2}
                metric={metricInfo?.label ?? metric}
                higherWins={metricInfo?.higherWins ?? true}
                winner={lastResult.winner}
                running={running}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
