import { BENCHMARK_ENDPOINTS } from "@shared/types";
import type { BenchmarkConfig as Config } from "@shared/types";
import { GlossaryTerm } from "./GlossaryTerm";

interface Props {
  config: Config;
  onChange: (config: Config) => void;
}

export function BenchmarkConfig({ config, onChange }: Props) {
  const set = (partial: Partial<Config>) =>
    onChange({ ...config, ...partial });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1"><GlossaryTerm term="data size">Data Size</GlossaryTerm></label>
        <select
          value={config.dataSize}
          onChange={(e) =>
            set({ dataSize: e.target.value as Config["dataSize"] })
          }
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100"
        >
          <option value="small">Small (8a/16b)</option>
          <option value="medium">Medium (100a/1Kb)</option>
          <option value="large">Large (500a/50Kb)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Mode</label>
        <div className="flex gap-4 mt-2">
          <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="quick"
              checked={config.mode === "quick"}
              onChange={() => set({ mode: "quick" })}
            />
            <GlossaryTerm term="quick mode">Quick</GlossaryTerm>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="full"
              checked={config.mode === "full"}
              onChange={() => set({ mode: "full" })}
            />
            <GlossaryTerm term="full mode">Full</GlossaryTerm>
          </label>
        </div>
      </div>

      <div className="col-span-2 md:col-span-3">
        <label className="block text-sm text-gray-400 mb-1">
          <GlossaryTerm term="endpoints">Endpoints</GlossaryTerm> ({BENCHMARK_ENDPOINTS.length})
        </label>
        <div className="flex flex-wrap gap-2">
          {BENCHMARK_ENDPOINTS.map((ep) => (
            <span
              key={ep}
              className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
            >
              {ep}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
