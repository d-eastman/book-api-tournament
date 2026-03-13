import { getColor } from "../lib/colors";
import { GlossaryTerm } from "./GlossaryTerm";

interface Props {
  entry1: { id: string; language: string; framework: string; score?: number };
  entry2: { id: string; language: string; framework: string; score?: number };
  metric: string;
  higherWins: boolean;
  winner?: string;
  running?: boolean;
}

export function MatchupCard({
  entry1,
  entry2,
  metric,
  higherWins,
  winner,
  running,
}: Props) {
  const maxScore = Math.max(entry1.score ?? 0, entry2.score ?? 0);

  const barWidth = (score: number | undefined) => {
    if (!score || !maxScore) return 0;
    return (score / maxScore) * 100;
  };

  const entryRow = (entry: typeof entry1, isWinner: boolean) => {
    const color = getColor(entry.language);
    return (
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded ${
          isWinner
            ? "border"
            : winner
              ? "bg-gray-800/50 opacity-60"
              : "bg-gray-800"
        }`}
        style={{
          borderLeft: `4px solid ${color.primary}`,
          ...(isWinner
            ? {
                borderColor: color.primary,
                backgroundColor: `${color.primary}15`,
                boxShadow: `0 0 12px ${color.primary}40`,
              }
            : {}),
        }}
      >
        <span className="flex-shrink-0 text-base" aria-hidden="true">
          {color.emoji}
        </span>
        <span className="text-sm font-medium text-gray-200 w-40 truncate">
          {entry.language}/{entry.framework}
        </span>
        {entry.score !== undefined && (
          <>
            <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${barWidth(entry.score)}%`,
                  backgroundColor: isWinner ? color.primary : "#6B7280",
                }}
              />
            </div>
            <span className="text-sm text-gray-300 w-24 text-right font-mono">
              {entry.score.toFixed(2)}
            </span>
          </>
        )}
        {isWinner && (
          <span className="text-xs font-bold" style={{ color: color.primary }}>
            WIN
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span><GlossaryTerm term={metric.split(" (")[0].toLowerCase()}>{metric}</GlossaryTerm></span>
        <span>{higherWins ? "higher wins" : "lower wins"}</span>
        {running && (
          <span className="text-yellow-400 animate-pulse">Running...</span>
        )}
      </div>
      {entryRow(entry1, winner === entry1.id)}
      <div className="text-center text-xs text-gray-600">vs</div>
      {entryRow(entry2, winner === entry2.id)}
    </div>
  );
}
