import { Hono } from 'hono';
import * as benchmarkRunner from '../services/benchmark-runner.js';

export const benchmarkRoutes = new Hono();

benchmarkRoutes.post('/run', async (c) => {
  const body = await c.req.json();
  const { entryId, level, dataSize, mode, endpoints } = body;

  if (!entryId) return c.json({ error: 'entryId is required' }, 400);

  try {
    const result = await benchmarkRunner.runBenchmark(entryId, {
      level: level || 'v3',
      dataSize: dataSize || 'small',
      mode: mode || 'quick',
      endpoints,
    });
    return c.json(result);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

benchmarkRoutes.post('/run-batch', async (c) => {
  const body = await c.req.json();
  const { entryIds, level, dataSize, mode } = body;

  if (!entryIds || !Array.isArray(entryIds)) {
    return c.json({ error: 'entryIds array is required' }, 400);
  }

  try {
    const results = await benchmarkRunner.runBatchBenchmark(entryIds, {
      level: level || 'v3',
      dataSize: dataSize || 'small',
      mode: mode || 'quick',
    });
    return c.json({ results });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

benchmarkRoutes.get('/status', (c) => {
  return c.json(benchmarkRunner.getStatus());
});

benchmarkRoutes.post('/reset', (c) => {
  benchmarkRunner.resetStatus();
  return c.json({ reset: true });
});
