import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Entry } from "@shared/types";
import { getColor } from "../lib/colors";
import * as api from "../lib/api";

export function LandingPage() {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    api.getEntries().then(setEntries).catch(console.error);
  }, []);

  const languages = [...new Set(entries.map((e) => e.language))].sort();

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Book API Tournament
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          One API spec, many implementations. Benchmark them head-to-head
          across languages and frameworks in a March Madness-style tournament.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/operator"
          className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-blue-500 transition group"
        >
          <h2 className="text-lg font-semibold mb-2 group-hover:text-blue-400 transition">
            Operator
          </h2>
          <p className="text-sm text-gray-400">
            Run batch benchmarks across entries. Configure data size
            and mode, then compare results side by side.
          </p>
        </Link>

        <Link
          to="/tournament"
          className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-purple-500 transition group"
        >
          <h2 className="text-lg font-semibold mb-2 group-hover:text-purple-400 transition">
            Tournament
          </h2>
          <p className="text-sm text-gray-400">
            Create a single-elimination bracket and run matchups one by one.
            Pick the winning metric and crown a champion.
          </p>
        </Link>

        <Link
          to="/results"
          className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-green-500 transition group"
        >
          <h2 className="text-lg font-semibold mb-2 group-hover:text-green-400 transition">
            Results
          </h2>
          <p className="text-sm text-gray-400">
            View and download saved benchmark and tournament results as CSV.
          </p>
        </Link>
      </div>

      {/* Entries overview */}
      {entries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            {entries.length} Entries
          </h2>

          {/* Language grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {languages.map((lang) => {
              const langEntries = entries.filter((e) => e.language === lang);
              return (
                <div
                  key={lang}
                  className="bg-gray-800 rounded-lg px-4 py-3 flex items-center gap-3"
                  style={{ borderLeft: `3px solid ${getColor(lang).primary}` }}
                >
                  <span className="text-lg flex-shrink-0" aria-hidden="true">
                    {getColor(lang).emoji}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-gray-200">
                      {lang}
                    </div>
                    <div className="text-xs text-gray-500">
                      {langEntries.map((e) => e.framework).join(", ")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
