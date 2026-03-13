import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { entriesRoutes } from './routes/entries.js';
import { containersRoutes } from './routes/containers.js';
import { benchmarkRoutes } from './routes/benchmark.js';
import { tournamentRoutes } from './routes/tournament.js';
import { resultsRoutes } from './routes/results.js';

const app = new Hono();

app.use('/*', cors());

app.route('/api/entries', entriesRoutes);
app.route('/api/containers', containersRoutes);
app.route('/api/benchmark', benchmarkRoutes);
app.route('/api/tournament', tournamentRoutes);
app.route('/api/results', resultsRoutes);

app.get('/api/health', (c) => c.json({ status: 'ok' }));

const port = 3001;
console.log(`Control Center backend running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
