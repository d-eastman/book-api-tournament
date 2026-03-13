import type { Tournament, Matchup, Round } from "@shared/types";
import { getColor } from "../lib/colors";
import { GlossaryTerm } from "./GlossaryTerm";

interface Props {
  tournament: Tournament;
  entries: Map<string, { language: string; framework: string }>;
  onRunMatchup?: (matchupId: string) => void;
  nextMatchupId?: string | null;
}

// Layout constants
const SLOT_H = 72;
const CARD_H = 52;
const CARD_W = 200;
const CONN_W = 40;
const HEADER_H = 28;
const LINE_COLOR = "#4B5563";

function matchupCenterY(roundIndex: number, matchupIndex: number): number {
  return (2 * matchupIndex + 1) * Math.pow(2, roundIndex) * SLOT_H / 2;
}

export function BracketView({
  tournament,
  entries,
  onRunMatchup,
  nextMatchupId,
}: Props) {
  const entryInfo = (id: string | null) => {
    if (!id) return null;
    const e = entries.get(id);
    if (!e) return null;
    return { ...e, color: getColor(e.language) };
  };

  const entryLabel = (id: string | null) => {
    if (!id) return "TBD";
    const e = entries.get(id);
    return e ? `${e.language}/${e.framework}` : id;
  };

  const championInfo = tournament.champion
    ? entryInfo(tournament.champion)
    : null;

  const totalRounds = tournament.rounds.length;

  // Split each round's matchups into top half (left side) and bottom half (right side)
  const splitRound = (round: Round) => {
    const mid = Math.ceil(round.matchups.length / 2);
    return {
      top: round.matchups.slice(0, mid),
      bottom: round.matchups.slice(mid),
    };
  };

  // Build columns: leftColumns[0]=R1 top, leftColumns[1]=R2 top, ...
  // rightColumns[0]=innermost right (SF bot), ..., rightColumns[L-1]=R1 bot
  const leftColumns: { matchups: Matchup[]; label: string; roundIndex: number }[] = [];
  const rightColumns: { matchups: Matchup[]; label: string; roundIndex: number }[] = [];
  let finalMatchup: Matchup | null = null;

  const roundLabel = (roundNum: number) => {
    if (roundNum === totalRounds) return "Final";
    if (roundNum === totalRounds - 1 && totalRounds > 2) return "Semifinal";
    return `Round ${roundNum}`;
  };

  for (let i = 0; i < totalRounds; i++) {
    const round = tournament.rounds[i];
    if (i === totalRounds - 1) {
      finalMatchup = round.matchups[0] ?? null;
    } else {
      const { top, bottom } = splitRound(round);
      leftColumns.push({ matchups: top, label: roundLabel(round.round), roundIndex: i });
      rightColumns.unshift({ matchups: bottom, label: roundLabel(round.round), roundIndex: i });
    }
  }

  const L = leftColumns.length; // number of non-final round columns per side
  const numR1 = leftColumns[0]?.matchups.length ?? 1;
  const totalH = numR1 * SLOT_H;

  // X positions for columns (left to right):
  // leftCol[0], conn, leftCol[1], conn, ..., leftCol[L-1], conn, FINAL, conn, rightCol[0], conn, ..., rightCol[L-1]
  const leftColX = (i: number) => i * (CARD_W + CONN_W);
  const leftConnX = (i: number) => i * (CARD_W + CONN_W) + CARD_W;
  const finalX = L * (CARD_W + CONN_W);
  const rightColX = (i: number) => (L + 1 + i) * (CARD_W + CONN_W);
  const rightConnX = (i: number) => (L + 1 + i) * (CARD_W + CONN_W) - CONN_W;

  const totalW = (2 * L + 1) * CARD_W + 2 * L * CONN_W;

  // For small brackets (1 round = final only)
  if (totalRounds <= 1 && finalMatchup) {
    return (
      <div className="space-y-6">
        {tournament.champion && renderChampionBanner(championInfo, entryLabel, tournament.champion)}
        <div className="flex justify-center">
          <div>
            <div className="text-xs font-medium text-gray-500 mb-2 text-center">Final</div>
            {renderMatchupCard(finalMatchup, nextMatchupId, onRunMatchup, entryInfo, entryLabel)}
          </div>
        </div>
      </div>
    );
  }

  // Collect all SVG connector lines
  const connectorLines: React.ReactNode[] = [];
  let connKey = 0;

  // Left side inter-round connectors
  for (let i = 0; i < L - 1; i++) {
    const outerRoundIndex = leftColumns[i].roundIndex;
    const innerCol = leftColumns[i + 1];
    const feederX = leftConnX(i); // right edge of outer column
    const targetX = leftColX(i + 1); // left edge of inner column

    for (let j = 0; j < innerCol.matchups.length; j++) {
      const y1 = matchupCenterY(outerRoundIndex, 2 * j) + HEADER_H;
      const y2 = matchupCenterY(outerRoundIndex, 2 * j + 1) + HEADER_H;
      const yt = matchupCenterY(outerRoundIndex + 1, j) + HEADER_H;
      connectorLines.push(
        <BracketConnector key={connKey++} x1={feederX} x2={targetX} y1={y1} y2={y2} yt={yt} />
      );
    }
  }

  // Left side → Final connector (horizontal line)
  if (L > 0) {
    const lastLeftCol = leftColumns[L - 1];
    const y = matchupCenterY(lastLeftCol.roundIndex, 0) + HEADER_H;
    const x1 = leftConnX(L - 1);
    const x2 = finalX;
    connectorLines.push(
      <line key={connKey++} x1={x1} y1={y} x2={x2} y2={y} stroke={LINE_COLOR} strokeWidth={1.5} />
    );
  }

  // Right side → Final connector (horizontal line)
  if (L > 0) {
    const firstRightCol = rightColumns[0]; // innermost right column
    const rightRoundIndex = L - 1; // same as leftColumns[L-1] roundIndex
    const y = matchupCenterY(rightRoundIndex, 0) + HEADER_H;
    const x1 = finalX + CARD_W;
    const x2 = rightColX(0);
    connectorLines.push(
      <line key={connKey++} x1={x1} y1={y} x2={x2} y2={y} stroke={LINE_COLOR} strokeWidth={1.5} />
    );
  }

  // Right side inter-round connectors
  // rightColumns: [0]=innermost (SF), ..., [L-1]=outermost (R1)
  // Flow: rightCol[k+1] (outer, more matchups) feeds into rightCol[k] (inner, fewer matchups)
  for (let k = 0; k < L - 1; k++) {
    const innerRoundIndex = L - 1 - k; // rightColumns[k] round index
    const outerRoundIndex = L - 2 - k; // rightColumns[k+1] round index
    const innerCol = rightColumns[k];
    const outerCol = rightColumns[k + 1];
    const feederX = rightColX(k + 1); // left edge of outer column (feeders)
    const targetX = rightColX(k) + CARD_W; // right edge of inner column (target)

    for (let j = 0; j < innerCol.matchups.length; j++) {
      const y1 = matchupCenterY(outerRoundIndex, 2 * j) + HEADER_H;
      const y2 = matchupCenterY(outerRoundIndex, 2 * j + 1) + HEADER_H;
      const yt = matchupCenterY(innerRoundIndex, j) + HEADER_H;
      // Mirror: feeders are on the right, target on the left
      connectorLines.push(
        <BracketConnector key={connKey++} x1={targetX} x2={feederX} y1={y1} y2={y2} yt={yt} />
      );
    }
  }

  return (
    <div className="space-y-6">
      {tournament.champion && renderChampionBanner(championInfo, entryLabel, tournament.champion)}

      <div className="overflow-x-auto pb-4">
        <div style={{ position: "relative", width: totalW, height: totalH + HEADER_H, margin: "0 auto" }}>
          {/* SVG connector lines */}
          <svg
            style={{ position: "absolute", top: 0, left: 0, width: totalW, height: totalH + HEADER_H, pointerEvents: "none" }}
          >
            {connectorLines}
          </svg>

          {/* Left side round labels and matchup cards */}
          {leftColumns.map((col, i) => (
            <div key={`ll-${i}`}>
              {/* Round label */}
              <div
                className="text-xs font-medium text-gray-500 text-center"
                style={{ position: "absolute", left: leftColX(i), top: 0, width: CARD_W }}
              >
                {col.label}
              </div>
              {/* Matchup cards */}
              {col.matchups.map((m, j) => {
                const cy = matchupCenterY(col.roundIndex, j);
                return (
                  <div
                    key={m.id}
                    style={{
                      position: "absolute",
                      left: leftColX(i),
                      top: cy - CARD_H / 2 + HEADER_H,
                      width: CARD_W,
                    }}
                  >
                    {renderMatchupCard(m, nextMatchupId, onRunMatchup, entryInfo, entryLabel)}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Final */}
          {finalMatchup && (
            <div>
              <div
                className="text-xs font-medium text-gray-500 text-center"
                style={{ position: "absolute", left: finalX, top: 0, width: CARD_W }}
              >
                Final
              </div>
              <div
                style={{
                  position: "absolute",
                  left: finalX,
                  top: totalH / 2 - CARD_H / 2 + HEADER_H,
                  width: CARD_W,
                }}
              >
                {renderMatchupCard(finalMatchup, nextMatchupId, onRunMatchup, entryInfo, entryLabel)}
              </div>
            </div>
          )}

          {/* Right side round labels and matchup cards */}
          {rightColumns.map((col, i) => {
            const roundIndex = L - 1 - i;
            return (
              <div key={`rl-${i}`}>
                <div
                  className="text-xs font-medium text-gray-500 text-center"
                  style={{ position: "absolute", left: rightColX(i), top: 0, width: CARD_W }}
                >
                  {col.label}
                </div>
                {col.matchups.map((m, j) => {
                  const cy = matchupCenterY(roundIndex, j);
                  return (
                    <div
                      key={m.id}
                      style={{
                        position: "absolute",
                        left: rightColX(i),
                        top: cy - CARD_H / 2 + HEADER_H,
                        width: CARD_W,
                      }}
                    >
                      {renderMatchupCard(m, nextMatchupId, onRunMatchup, entryInfo, entryLabel)}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// SVG bracket connector: two feeders merging into one target
function BracketConnector({ x1, x2, y1, y2, yt }: { x1: number; x2: number; y1: number; y2: number; yt: number }) {
  const midX = (x1 + x2) / 2;
  return (
    <g>
      <line x1={x1} y1={y1} x2={midX} y2={y1} stroke={LINE_COLOR} strokeWidth={1.5} />
      <line x1={x1} y1={y2} x2={midX} y2={y2} stroke={LINE_COLOR} strokeWidth={1.5} />
      <line x1={midX} y1={y1} x2={midX} y2={y2} stroke={LINE_COLOR} strokeWidth={1.5} />
      <line x1={midX} y1={yt} x2={x2} y2={yt} stroke={LINE_COLOR} strokeWidth={1.5} />
    </g>
  );
}

function renderMatchupCard(
  matchup: Matchup,
  nextMatchupId: string | null | undefined,
  onRunMatchup: ((id: string) => void) | undefined,
  entryInfo: (id: string | null) => { language: string; framework: string; color: ReturnType<typeof getColor> } | null,
  entryLabel: (id: string | null) => string,
) {
  const isNext = matchup.id === nextMatchupId;
  const canRun =
    isNext && onRunMatchup && matchup.entry1 && matchup.entry2 && !matchup.winner;
  const info1 = entryInfo(matchup.entry1);
  const info2 = entryInfo(matchup.entry2);
  const isLoser1 = matchup.winner && matchup.winner !== matchup.entry1;
  const isLoser2 = matchup.winner && matchup.winner !== matchup.entry2;

  return (
    <div
      className={`bg-gray-800 rounded border ${
        isNext
          ? "border-blue-500"
          : matchup.winner
            ? "border-gray-700"
            : "border-gray-700/50"
      }`}
    >
      <div
        className="flex items-center gap-1.5 px-2 py-1"
        style={{
          borderLeft: `3px solid ${info1?.color.primary ?? "#4B5563"}`,
          opacity: isLoser1 ? 0.4 : 1,
          backgroundColor:
            matchup.winner === matchup.entry1
              ? `${info1?.color.primary}15`
              : undefined,
        }}
      >
        <span className="flex-shrink-0 text-xs" aria-hidden="true">
          {info1?.color.emoji ?? "\u00A0"}
        </span>
        <span className="text-xs flex-1 truncate text-gray-200">
          {entryLabel(matchup.entry1)}
        </span>
        {matchup.entry1Score !== undefined && (
          <span className="text-xs text-gray-400 font-mono">
            {matchup.entry1Score.toFixed(1)}
          </span>
        )}
      </div>
      <div className="border-t border-gray-700/50" />
      <div
        className="flex items-center gap-1.5 px-2 py-1"
        style={{
          borderLeft: matchup.bye
            ? "3px dashed #4B5563"
            : `3px solid ${info2?.color.primary ?? "#4B5563"}`,
          opacity: isLoser2 ? 0.4 : 1,
          backgroundColor:
            matchup.winner === matchup.entry2
              ? `${info2?.color.primary}15`
              : undefined,
        }}
      >
        <span className="flex-shrink-0 text-xs" aria-hidden="true">
          {matchup.bye ? "\u00A0" : (info2?.color.emoji ?? "\u00A0")}
        </span>
        <span
          className={`text-xs flex-1 truncate ${matchup.bye ? "text-gray-500" : "text-gray-200"}`}
        >
          {matchup.bye ? <GlossaryTerm term="bye">BYE</GlossaryTerm> : entryLabel(matchup.entry2)}
        </span>
        {matchup.entry2Score !== undefined && (
          <span className="text-xs text-gray-400 font-mono">
            {matchup.entry2Score.toFixed(1)}
          </span>
        )}
      </div>
      {canRun && (
        <button
          onClick={() => onRunMatchup!(matchup.id)}
          className="w-full py-0.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 border-t border-gray-700"
        >
          Run Matchup
        </button>
      )}
    </div>
  );
}

function renderChampionBanner(
  championInfo: { language: string; framework: string; color: ReturnType<typeof getColor> } | null,
  entryLabel: (id: string | null) => string,
  championId: string,
) {
  return (
    <div
      className="text-center py-4 rounded-lg border"
      style={{
        borderColor: championInfo?.color.primary ?? "#CA8A04",
        backgroundColor: championInfo
          ? `${championInfo.color.primary}15`
          : "rgba(161,98,7,0.2)",
      }}
    >
      <div
        className="text-sm uppercase tracking-wider mb-1"
        style={{ color: championInfo?.color.primary ?? "#FACC15" }}
      >
        Champion
      </div>
      <div className="text-2xl font-bold text-gray-100">
        {championInfo && (
          <span className="mr-2">{championInfo.color.emoji}</span>
        )}
        {entryLabel(championId)}
      </div>
    </div>
  );
}
