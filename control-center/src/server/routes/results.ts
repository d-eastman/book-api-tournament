import { Hono } from 'hono';
import * as resultsStore from '../services/results-store.js';
import * as bracket from '../services/bracket-generator.js';

export const resultsRoutes = new Hono();

resultsRoutes.get('/', (c) => {
  const results = resultsStore.listResults();
  return c.json({ results });
});

resultsRoutes.get('/:filename', (c) => {
  const filename = c.req.param('filename');
  try {
    const content = resultsStore.getResultFile(filename);
    const parsed = resultsStore.parseCSV(content);
    return c.json({ filename, data: parsed, raw: content });
  } catch (e: any) {
    return c.json({ error: e.message }, 404);
  }
});

resultsRoutes.post('/save', async (c) => {
  const body = await c.req.json();
  const { name, results } = body;

  if (!name || !results) {
    return c.json({ error: 'name and results are required' }, 400);
  }

  const filename = resultsStore.saveBatchResults(name, results);
  return c.json({ filename, saved: true });
});

resultsRoutes.post('/save-tournament', async (c) => {
  const body = await c.req.json();
  const { tournamentId } = body;

  const tournament = bracket.getTournament(tournamentId);
  if (!tournament) return c.json({ error: 'Tournament not found' }, 404);

  const filename = resultsStore.saveTournamentResults(tournament);
  return c.json({ filename, saved: true });
});
