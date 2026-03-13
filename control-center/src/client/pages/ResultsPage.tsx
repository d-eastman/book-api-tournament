import { useState, useEffect } from "react";
import type { SavedResult } from "@shared/types";
import * as api from "../lib/api";

export function ResultsPage() {
  const [results, setResults] = useState<SavedResult[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, unknown>[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listResults()
      .then(setResults)
      .catch((e) => setListError(e instanceof Error ? e.message : "Failed to load results"))
      .finally(() => setListLoading(false));
  }, []);

  const viewResult = async (filename: string) => {
    setSelectedFile(filename);
    setLoading(true);
    try {
      const result = await api.getResult(filename);
      setData(result.data);
      setDataError(null);
    } catch (e) {
      setData(null);
      setDataError(e instanceof Error ? e.message : "Failed to load result");
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = (filename: string) => {
    window.open(`/api/results/${filename}?download=true`, "_blank");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Results</h1>

      {listLoading ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
          Loading results...
        </div>
      ) : listError ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center space-y-3">
          <div className="text-gray-400">Could not load saved results.</div>
          <div className="text-sm text-gray-500">{listError}</div>
          <p className="text-sm text-gray-500">
            Run a benchmark or tournament from the Operator or Tournament page to generate results.
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center space-y-3">
          <div className="text-gray-400">No saved results yet.</div>
          <p className="text-sm text-gray-500">
            Run a benchmark from the Operator page or complete a tournament to see results here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* File list */}
          <div className="space-y-2">
            {results.map((r) => (
              <button
                key={r.filename}
                onClick={() => viewResult(r.filename)}
                className={`w-full text-left px-4 py-3 rounded border transition ${
                  selectedFile === r.filename
                    ? "bg-gray-700 border-blue-500"
                    : "bg-gray-800 border-gray-700 hover:border-gray-600"
                }`}
              >
                <div className="text-sm font-medium text-gray-200">
                  {r.name}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      r.type === "tournament"
                        ? "bg-purple-900/50 text-purple-300"
                        : "bg-blue-900/50 text-blue-300"
                    }`}
                  >
                    {r.type}
                  </span>
                  <span className="text-xs text-gray-500">{r.date}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Data view */}
          <div className="md:col-span-2">
            {selectedFile && loading && (
              <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
                Loading...
              </div>
            )}
            {selectedFile && !loading && data && (
              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-gray-400">
                    {selectedFile}
                  </h2>
                  <button
                    onClick={() => downloadCsv(selectedFile)}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Download CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-400 uppercase border-b border-gray-700">
                      <tr>
                        {data.length > 0 &&
                          Object.keys(data[0]).map((key) => (
                            <th key={key} className="px-3 py-2">
                              {key}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, i) => (
                        <tr
                          key={i}
                          className="border-b border-gray-800 hover:bg-gray-700/50"
                        >
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="px-3 py-2 text-gray-300">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {selectedFile && !loading && dataError && (
              <div className="bg-gray-800 rounded-lg p-8 text-center space-y-2">
                <div className="text-gray-400">Failed to load this result.</div>
                <div className="text-sm text-gray-500">{dataError}</div>
              </div>
            )}
            {!selectedFile && (
              <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-500">
                Select a result file to view
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
