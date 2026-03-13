import { Hono } from 'hono';
import { scanEntries } from '../services/entry-scanner.js';

export const entriesRoutes = new Hono();

entriesRoutes.get('/', (c) => {
  let entries = scanEntries();

  const sort = c.req.query('sort');
  if (sort === 'framework') {
    entries.sort((a, b) => a.framework.localeCompare(b.framework));
  } else if (sort === 'language') {
    entries.sort((a, b) => a.language.localeCompare(b.language) || a.framework.localeCompare(b.framework));
  }

  return c.json({ entries });
});
