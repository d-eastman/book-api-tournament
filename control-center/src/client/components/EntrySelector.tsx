import { useState, useMemo } from "react";
import type { Entry } from "@shared/types";
import { getColor } from "../lib/colors";

interface Props {
  entries: Entry[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}

type SortKey = "language" | "framework" | "level";

export function EntrySelector({
  entries,
  selected,
  onToggle,
  onSelectAll,
  onSelectNone,
}: Props) {
  const [sortBy, setSortBy] = useState<SortKey>("language");
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    return entries
      .filter(
        (e) =>
          !q ||
          e.language.toLowerCase().includes(q) ||
          e.framework.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q)
      )
      .sort((a, b) => a[sortBy].localeCompare(b[sortBy]));
  }, [entries, sortBy, filter]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Filter entries..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-100 placeholder-gray-400"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-100"
        >
          <option value="language">Sort: Language</option>
          <option value="framework">Sort: Framework</option>
          <option value="level">Sort: Level</option>
        </select>
      </div>

      <div className="flex gap-2 text-sm">
        <button
          onClick={onSelectAll}
          className="text-blue-400 hover:text-blue-300"
        >
          Select All
        </button>
        <span className="text-gray-500">|</span>
        <button
          onClick={onSelectNone}
          className="text-blue-400 hover:text-blue-300"
        >
          Select None
        </button>
        <span className="text-gray-500 ml-auto">
          {selected.size}/{entries.length} selected
        </span>
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto">
        {filtered.map((entry) => (
          <label
            key={entry.id}
            className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 cursor-pointer"
            style={{ borderLeft: `3px solid ${getColor(entry.language).primary}` }}
          >
            <input
              type="checkbox"
              checked={selected.has(entry.id)}
              onChange={() => onToggle(entry.id)}
              className="rounded border-gray-500"
            />
            <span className="flex-shrink-0 text-sm" aria-hidden="true">
              {getColor(entry.language).emoji}
            </span>
            <span className="text-sm text-gray-200 flex-1">
              {entry.language}/{entry.framework}
            </span>
            {!entry.hasDockerfile && (
              <span className="text-xs text-red-400">No Dockerfile</span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
