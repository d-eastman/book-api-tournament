import { useState, useEffect, useRef, useCallback } from "react";
import type {
  Entry,
  BenchmarkConfig as BenchConfig,
  BenchmarkResult,
  BenchmarkStatus,
} from "@shared/types";
import { EntrySelector } from "../components/EntrySelector";
import { BenchmarkConfig } from "../components/BenchmarkConfig";
import { ResultsTable } from "../components/ResultsTable";
import { GlossaryTerm } from "../components/GlossaryTerm";
import { getColor } from "../lib/colors";
import * as api from "../lib/api";

export function OperatorPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [config, setConfig] = useState<BenchConfig>({
    level: "v3",
    dataSize: "small",
    mode: "quick",
  });
  const [status, setStatus] = useState<BenchmarkStatus>({ state: "idle" });
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    api.getEntries().then(setEntries).catch(console.error);
  }, []);

  const filteredEntries = entries.filter((e) => {
    if (config.level === "hardcoded") return e.level === "hardcoded";
    const levels = ["v1", "v2", "v3"];
    return levels.indexOf(e.level) >= levels.indexOf(config.level);
  });

  const filteredIds = new Set(filteredEntries.map((e) => e.id));
  useEffect(() => {
    setSelected((prev) => {
      const next = new Set([...prev].filter((id) => filteredIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [config.level]);

  const entryMap = new Map(
    entries.map((e) => [
      e.id,
      { language: e.language, framework: e.framework },
    ])
  );

  const toggleEntry = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pollStatus = useCallback(() => {
    pollRef.current = setInterval(async () => {
      try {
        const s = await api.getBenchmarkStatus();
        setStatus(s);
        if (s.state === "complete") {
          clearInterval(pollRef.current);
          setResults(s.results);
        }
      } catch {
        clearInterval(pollRef.current);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const runBatch = async () => {
    if (selected.size === 0) return;
    setError(null);
    setResults([]);
    try {
      await api.runBatchBenchmark(Array.from(selected), config);
      pollStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Benchmark failed");
    }
  };

  const saveResults = async () => {
    if (results.length === 0) return;
    try {
      const name = `batch-${config.level}-${config.dataSize}-${config.mode}`;
      const { filename } = await api.saveBatchResults(name, results);
      alert(`Saved as ${filename}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const isRunning = status.state !== "idle" && status.state !== "complete";

  const entryLabel = (id: string) => {
    const info = entryMap.get(id);
    return info ? `${info.language}/${info.framework}` : id;
  };

  const statusInfo = () => {
    switch (status.state) {
      case "idle":
      case "complete":
        return null;
      case "building":
        return { step: "Building", detail: entryLabel(status.entryId), entryId: status.entryId };
      case "starting":
        return { step: "Starting", detail: entryLabel(status.entryId), entryId: status.entryId };
      case "warming":
        return { step: "Warming up", detail: entryLabel(status.entryId), entryId: status.entryId };
      case "benchmarking":
        return {
          step: "Benchmarking",
          detail: `${entryLabel(status.entryId)} — ${status.endpoint}`,
          progress: status.progress,
          entryId: status.entryId,
        };
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Operator</h1>

      <ol className="text-sm text-gray-400 list-decimal list-inside flex flex-wrap gap-x-6 gap-y-1">
        <li>Choose <GlossaryTerm term="level">level</GlossaryTerm> and <GlossaryTerm term="data size">data size</GlossaryTerm></li>
        <li>Choose <GlossaryTerm term="quick mode">mode</GlossaryTerm></li>
        <li>Select two or more entries</li>
        <li>Run benchmark</li>
      </ol>

      {/* Config */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-sm font-medium text-gray-400 mb-3">
          Benchmark Configuration
        </h2>
        <BenchmarkConfig config={config} onChange={setConfig} />
      </div>

      {/* Entry selection */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-sm font-medium text-gray-400 mb-3">
          Select Entries
        </h2>
        <EntrySelector
          entries={filteredEntries}
          selected={selected}
          onToggle={toggleEntry}
          onSelectAll={() =>
            setSelected(new Set(filteredEntries.map((e) => e.id)))
          }
          onSelectNone={() => setSelected(new Set())}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={runBatch}
          disabled={selected.size === 0 || isRunning}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded font-medium text-sm transition"
        >
          {isRunning ? "Running..." : `Run Benchmark (${selected.size} entries)`}
        </button>
        {isRunning && (
          <button
            onClick={() => api.resetBenchmark().then(() => setStatus({ state: "idle" }))}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress panel */}
      {isRunning && (() => {
        const info = statusInfo();
        if (!info) return null;
        const entryMeta = entryMap.get(info.entryId);
        const langColor = entryMeta ? getColor(entryMeta.language) : null;
        const accentColor = langColor?.primary ?? "#EAB308";
        return (
          <div
            className="bg-gray-800 rounded-lg p-4 space-y-2"
            style={{ borderLeft: `4px solid ${accentColor}` }}
          >
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: accentColor }}
                />
                <span
                  className="relative inline-flex rounded-full h-3 w-3"
                  style={{ backgroundColor: accentColor }}
                />
              </span>
              {langColor && (
                <span className="text-sm" aria-hidden="true">{langColor.emoji}</span>
              )}
              <span className="text-sm font-medium" style={{ color: accentColor }}>
                {info.step}
              </span>
            </div>
            <div className="text-sm text-gray-300 pl-6">{info.detail}</div>
            {"progress" in info && info.progress && (
              <div className="text-xs text-gray-500 pl-6">{info.progress}</div>
            )}
          </div>
        );
      })()}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-400">Results</h2>
            <button
              onClick={saveResults}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Save to CSV
            </button>
          </div>
          <ResultsTable results={results} entries={entryMap} />
        </div>
      )}
    </div>
  );
}
