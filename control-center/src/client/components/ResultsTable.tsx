import { useState, useMemo } from "react";
import type { BenchmarkResult } from "@shared/types";
import { getColor } from "../lib/colors";
import { GlossaryTerm } from "./GlossaryTerm";

interface Props {
  results: BenchmarkResult[];
  entries: Map<string, { language: string; framework: string }>;
}

type SortKey =
  | "entryId"
  | "startupMs"
  | "imageSizeMb"
  | "memIdleMib"
  | "memLoadedMib";

export function ResultsTable({ results, entries }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("entryId");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);

  const allEndpoints = useMemo(() => {
    const eps = new Set<string>();
    results.forEach((r) => Object.keys(r.endpoints).forEach((e) => eps.add(e)));
    return Array.from(eps);
  }, [results]);

  const sorted = useMemo(() => {
    return [...results].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "entryId") cmp = a.entryId.localeCompare(b.entryId);
      else cmp = (a[sortKey] as number) - (b[sortKey] as number);
      return sortAsc ? cmp : -cmp;
    });
  }, [results, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(key === "entryId");
    }
  };

  const arrow = (key: SortKey) =>
    sortKey === key ? (sortAsc ? " \u25B2" : " \u25BC") : "";

  return (
    <div className="space-y-3">
      {allEndpoints.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedEndpoint(null)}
            className={`text-xs px-2 py-1 rounded ${
              !selectedEndpoint
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Overview
          </button>
          {allEndpoints.map((ep) => (
            <button
              key={ep}
              onClick={() => setSelectedEndpoint(ep)}
              className={`text-xs px-2 py-1 rounded ${
                selectedEndpoint === ep
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {ep}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-400 uppercase border-b border-gray-700">
            <tr>
              <th
                className="px-3 py-2 cursor-pointer hover:text-gray-200"
                onClick={() => toggleSort("entryId")}
              >
                Entry{arrow("entryId")}
              </th>
              {!selectedEndpoint ? (
                <>
                  <th
                    className="px-3 py-2 cursor-pointer hover:text-gray-200"
                    onClick={() => toggleSort("startupMs")}
                  >
                    <GlossaryTerm term="startup time">Startup</GlossaryTerm>{arrow("startupMs")}
                  </th>
                  <th
                    className="px-3 py-2 cursor-pointer hover:text-gray-200"
                    onClick={() => toggleSort("imageSizeMb")}
                  >
                    <GlossaryTerm term="image size">Image</GlossaryTerm>{arrow("imageSizeMb")}
                  </th>
                  <th
                    className="px-3 py-2 cursor-pointer hover:text-gray-200"
                    onClick={() => toggleSort("memIdleMib")}
                  >
                    <GlossaryTerm term="idle memory">Mem Idle</GlossaryTerm>{arrow("memIdleMib")}
                  </th>
                  <th
                    className="px-3 py-2 cursor-pointer hover:text-gray-200"
                    onClick={() => toggleSort("memLoadedMib")}
                  >
                    <GlossaryTerm term="loaded memory">Mem Load</GlossaryTerm>{arrow("memLoadedMib")}
                  </th>
                </>
              ) : (
                <>
                  <th className="px-3 py-2"><GlossaryTerm term="req/s">req/s</GlossaryTerm></th>
                  <th className="px-3 py-2"><GlossaryTerm term="average latency">avg (ms)</GlossaryTerm></th>
                  <th className="px-3 py-2"><GlossaryTerm term="p50">p50 (ms)</GlossaryTerm></th>
                  <th className="px-3 py-2"><GlossaryTerm term="p95">p95 (ms)</GlossaryTerm></th>
                  <th className="px-3 py-2"><GlossaryTerm term="p99">p99 (ms)</GlossaryTerm></th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const info = entries.get(r.entryId);
              const ep = selectedEndpoint
                ? r.endpoints[selectedEndpoint]
                : null;
              return (
                <tr
                  key={r.entryId}
                  className="border-b border-gray-800 hover:bg-gray-800"
                  style={{
                    borderLeft: info
                      ? `3px solid ${getColor(info.language).primary}`
                      : undefined,
                  }}
                >
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2">
                      {info && (
                        <span className="flex-shrink-0 text-sm" aria-hidden="true">
                          {getColor(info.language).emoji}
                        </span>
                      )}
                      <span className="text-gray-200">
                        {info
                          ? `${info.language}/${info.framework}`
                          : r.entryId}
                      </span>
                    </span>
                  </td>
                  {!selectedEndpoint ? (
                    <>
                      <td className="px-3 py-2 text-gray-300">
                        {r.startupMs.toFixed(0)} ms
                      </td>
                      <td className="px-3 py-2 text-gray-300">
                        {r.imageSizeMb.toFixed(1)} MB
                      </td>
                      <td className="px-3 py-2 text-gray-300">
                        {r.memIdleMib.toFixed(1)} MiB
                      </td>
                      <td className="px-3 py-2 text-gray-300">
                        {r.memLoadedMib.toFixed(1)} MiB
                      </td>
                    </>
                  ) : ep ? (
                    <>
                      <td className="px-3 py-2 text-gray-300">
                        {ep.reqPerSec.toFixed(1)}
                      </td>
                      <td className="px-3 py-2 text-gray-300">
                        {ep.avgMs.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-gray-300">
                        {ep.p50Ms.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-gray-300">
                        {ep.p95Ms.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-gray-300">
                        {ep.p99Ms.toFixed(2)}
                      </td>
                    </>
                  ) : (
                    <td
                      colSpan={5}
                      className="px-3 py-2 text-gray-500 italic"
                    >
                      No data for this endpoint
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
