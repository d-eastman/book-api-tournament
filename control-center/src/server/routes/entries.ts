import { Hono } from 'hono';
import { scanEntries, filterByLevel } from '../services/entry-scanner.js';

export const entriesRoutes = new Hono();

entriesRoutes.get('/', (c) => {
  let entries = scanEntries();

  const level = c.req.query('level');
  if (level) {
    entries = filterByLevel(entries, level);
  }

  const sort = c.req.query('sort');
  if (sort === 'framework') {
    entries.sort((a, b) => a.framework.localeCompare(b.framework));
  } else if (sort === 'language') {
    entries.sort((a, b) => a.language.localeCompare(b.language) || a.framework.localeCompare(b.framework));
  }

  return c.json({ entries });
});
