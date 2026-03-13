import type { Tournament, Round, Matchup, MatchupResult } from '../../shared/types.js';

function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

let tournamentCounter = 0;
const tournaments = new Map<string, Tournament>();

export function createTournament(
  name: string,
  entryIds: string[],
  level: string,
  dataSize: string,
  mode: 'quick' | 'full',
  metric: string,
  benchmarkEndpoint: string
): Tournament {
  const shuffled = fisherYatesShuffle(entryIds);
  const bracketSize = nextPowerOf2(shuffled.length);
  const byeCount = bracketSize - shuffled.length;

  // Create slots and assign entries + byes randomly
  const slots: (string | null)[] = [];
  for (let i = 0; i < shuffled.length; i++) slots.push(shuffled[i]);
  for (let i = 0; i < byeCount; i++) slots.push(null);
  const randomizedSlots = fisherYatesShuffle(slots);

  // Create first round matchups
  const round1Matchups: Matchup[] = [];
  for (let i = 0; i < bracketSize; i += 2) {
    const entry1 = randomizedSlots[i];
    const entry2 = randomizedSlots[i + 1];
    const isBye = entry1 === null || entry2 === null;
    round1Matchups.push({
      id: `r1-m${round1Matchups.length + 1}`,
      entry1,
      entry2,
      winner: isBye ? (entry1 || entry2) : null,
      bye: isBye,
    });
  }

  // Build subsequent rounds (empty)
  const totalRounds = Math.log2(bracketSize);
  const rounds: Round[] = [{ round: 1, matchups: round1Matchups }];

  for (let r = 2; r <= totalRounds; r++) {
    const matchupCount = bracketSize / Math.pow(2, r);
    const matchups: Matchup[] = Array.from({ length: matchupCount }, (_, i) => ({
      id: `r${r}-m${i + 1}`,
      entry1: null,
      entry2: null,
      winner: null,
      bye: false,
    }));
    rounds.push({ round: r, matchups });
  }

  // Advance bye winners to round 2
  advanceByeWinners(rounds);

  tournamentCounter++;
  const id = `t-${new Date().toISOString().slice(0, 10)}-${String(tournamentCounter).padStart(3, '0')}`;

  const tournament: Tournament = {
    id,
    name,
    level,
    dataSize,
    mode,
    metric,
    benchmarkEndpoint,
    bracketSize,
    totalEntries: entryIds.length,
    byes: byeCount,
    rounds,
    createdAt: new Date().toISOString(),
  };

  tournaments.set(id, tournament);
  return tournament;
}

function advanceByeWinners(rounds: Round[]): void {
  if (rounds.length < 2) return;
  const round1 = rounds[0];
  const round2 = rounds[1];

  for (let i = 0; i < round1.matchups.length; i++) {
    const matchup = round1.matchups[i];
    if (matchup.bye && matchup.winner) {
      const nextMatchupIdx = Math.floor(i / 2);
      const slot = i % 2 === 0 ? 'entry1' : 'entry2';
      if (round2.matchups[nextMatchupIdx]) {
        round2.matchups[nextMatchupIdx][slot] = matchup.winner;
      }
    }
  }
}

export function resolveMatchup(
  tournamentId: string,
  matchupId: string,
  entry1Score: number,
  entry2Score: number,
  higherWins: boolean
): MatchupResult {
  const tournament = tournaments.get(tournamentId);
  if (!tournament) throw new Error(`Tournament ${tournamentId} not found`);

  // Find the matchup
  let matchup: Matchup | undefined;
  let roundIdx = -1;
  let matchupIdx = -1;

  for (let r = 0; r < tournament.rounds.length; r++) {
    const idx = tournament.rounds[r].matchups.findIndex(m => m.id === matchupId);
    if (idx >= 0) {
      matchup = tournament.rounds[r].matchups[idx];
      roundIdx = r;
      matchupIdx = idx;
      break;
    }
  }

  if (!matchup || !matchup.entry1 || !matchup.entry2) {
    throw new Error(`Matchup ${matchupId} not found or incomplete`);
  }

  // Determine winner
  matchup.entry1Score = entry1Score;
  matchup.entry2Score = entry2Score;

  if (higherWins) {
    matchup.winner = entry1Score >= entry2Score ? matchup.entry1 : matchup.entry2;
  } else {
    matchup.winner = entry1Score <= entry2Score ? matchup.entry1 : matchup.entry2;
  }

  // Advance winner to next round
  const nextRound = tournament.rounds[roundIdx + 1];
  if (nextRound) {
    const nextMatchupIdx = Math.floor(matchupIdx / 2);
    const slot = matchupIdx % 2 === 0 ? 'entry1' : 'entry2';
    if (nextRound.matchups[nextMatchupIdx]) {
      nextRound.matchups[nextMatchupIdx][slot] = matchup.winner;
    }
  }

  // Check if tournament is complete
  const finalRound = tournament.rounds[tournament.rounds.length - 1];
  if (finalRound.matchups[0]?.winner) {
    tournament.champion = finalRound.matchups[0].winner;
  }

  return {
    matchupId,
    entry1: { entryId: matchup.entry1, score: entry1Score },
    entry2: { entryId: matchup.entry2, score: entry2Score },
    metric: tournament.metric,
    winner: matchup.winner,
  };
}

export function getTournament(id: string): Tournament | undefined {
  return tournaments.get(id);
}

export function listTournaments(): Tournament[] {
  return Array.from(tournaments.values());
}

export function getNextMatchup(tournamentId: string): Matchup | null {
  const tournament = tournaments.get(tournamentId);
  if (!tournament) return null;

  for (const round of tournament.rounds) {
    for (const matchup of round.matchups) {
      if (!matchup.bye && !matchup.winner && matchup.entry1 && matchup.entry2) {
        return matchup;
      }
    }
  }
  return null;
}
