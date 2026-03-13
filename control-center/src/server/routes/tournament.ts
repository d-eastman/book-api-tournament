import { Hono } from 'hono';
import * as bracket from '../services/bracket-generator.js';
import * as benchmarkRunner from '../services/benchmark-runner.js';
import { METRIC_OPTIONS } from '../../shared/types.js';

export const tournamentRoutes = new Hono();

tournamentRoutes.post('/create', async (c) => {
  const body = await c.req.json();
  const { name, entryIds, dataSize, mode, metric, benchmarkEndpoint } = body;

  if (!name || !entryIds || entryIds.length < 2) {
    return c.json({ error: 'name and at least 2 entryIds required' }, 400);
  }

  const tournament = bracket.createTournament(
    name,
    entryIds,
    dataSize || 'small',
    mode || 'quick',
    metric || 'throughput',
    benchmarkEndpoint || 'GET /api/authors'
  );

  return c.json(tournament);
});

tournamentRoutes.get('/:id', (c) => {
  const tournament = bracket.getTournament(c.req.param('id'));
  if (!tournament) return c.json({ error: 'Tournament not found' }, 404);
  return c.json(tournament);
});

tournamentRoutes.get('/', (c) => {
  return c.json({ tournaments: bracket.listTournaments() });
});

tournamentRoutes.post('/:id/run-matchup', async (c) => {
  const tournamentId = c.req.param('id');
  const body = await c.req.json();
  const { matchupId } = body;

  const tournament = bracket.getTournament(tournamentId);
  if (!tournament) return c.json({ error: 'Tournament not found' }, 404);

  // Find the matchup
  let matchup: any = null;
  for (const round of tournament.rounds) {
    const m = round.matchups.find(m => m.id === matchupId);
    if (m) { matchup = m; break; }
  }

  if (!matchup || !matchup.entry1 || !matchup.entry2) {
    return c.json({ error: 'Matchup not found or not ready' }, 400);
  }

  try {
    // Benchmark both entries
    const config = {
      dataSize: tournament.dataSize as any,
      mode: tournament.mode,
      endpoints: [tournament.benchmarkEndpoint],
    };

    const result1 = await benchmarkRunner.runBenchmark(matchup.entry1, config);
    const result2 = await benchmarkRunner.runBenchmark(matchup.entry2, config);

    // Extract scores based on metric
    const score1 = extractScore(result1, tournament.metric);
    const score2 = extractScore(result2, tournament.metric);

    const metricOption = METRIC_OPTIONS.find(m => m.value === tournament.metric);
    const higherWins = metricOption?.higherWins ?? true;

    const matchupResult = bracket.resolveMatchup(
      tournamentId, matchupId, score1, score2, higherWins
    );

    return c.json(matchupResult);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

tournamentRoutes.post('/:id/next', async (c) => {
  const tournamentId = c.req.param('id');
  const matchup = bracket.getNextMatchup(tournamentId);
  if (!matchup) return c.json({ error: 'No more matchups to run' }, 400);
  return c.json(matchup);
});

function extractScore(result: any, metric: string): number {
  const firstEndpoint = Object.values(result.endpoints)[0] as any;
  if (!firstEndpoint) return 0;

  switch (metric) {
    case 'throughput': return firstEndpoint.reqPerSec;
    case 'p99': return firstEndpoint.p99Ms;
    case 'p95': return firstEndpoint.p95Ms;
    case 'avgLatency': return firstEndpoint.avgMs;
    case 'memory': return result.memLoadedMib;
    case 'startup': return result.startupMs;
    case 'imageSize': return result.imageSizeMb;
    case 'efficiency':
      return result.memLoadedMib > 0
        ? Math.round(firstEndpoint.reqPerSec / result.memLoadedMib * 100) / 100
        : 0;
    default: return firstEndpoint.reqPerSec;
  }
}
