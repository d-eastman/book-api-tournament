import { Hono } from 'hono';
import * as dockerService from '../services/docker.js';

export const containersRoutes = new Hono();

containersRoutes.post('/build', async (c) => {
  const { entryId } = await c.req.json();
  if (!entryId) return c.json({ error: 'entryId is required' }, 400);

  try {
    const result = await dockerService.buildImage(entryId);
    return c.json({ entryId, ...result });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

containersRoutes.post('/start', async (c) => {
  const { entryId, port } = await c.req.json();
  if (!entryId) return c.json({ error: 'entryId is required' }, 400);

  try {
    const info = await dockerService.startContainer(entryId, port || 9000);
    return c.json({ entryId, ...info });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

containersRoutes.post('/stop', async (c) => {
  const { entryId } = await c.req.json();
  if (!entryId) return c.json({ error: 'entryId is required' }, 400);

  try {
    await dockerService.stopContainer(entryId);
    return c.json({ entryId, stopped: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

containersRoutes.post('/stop-all', async (c) => {
  await dockerService.stopAllContainers();
  return c.json({ stopped: true });
});
