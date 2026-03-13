import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { Entry } from '../../shared/types.js';

const REPO_ROOT = path.resolve(import.meta.dirname, '../../../..');
const ENTRIES_DIR = path.join(REPO_ROOT, 'entries');

export function scanEntries(): Entry[] {
  const dirs = fs.readdirSync(ENTRIES_DIR).filter(d => {
    return d.startsWith('api-') && fs.statSync(path.join(ENTRIES_DIR, d)).isDirectory();
  });

  return dirs.map(dir => {
    const entryPath = path.join(ENTRIES_DIR, dir);
    const yamlPath = path.join(entryPath, 'entry.yaml');
    const dockerfilePath = path.join(entryPath, 'Dockerfile');

    let meta: any = {};
    if (fs.existsSync(yamlPath)) {
      meta = yaml.load(fs.readFileSync(yamlPath, 'utf-8')) as any;
    }

    return {
      id: dir,
      framework: meta.framework || 'Unknown',
      language: meta.language || 'Unknown',
      version: meta.version || '',
      author: meta.author || '',
      repo: meta.repo || '',
      notes: meta.notes || '',
      path: `entries/${dir}`,
      hasDockerfile: fs.existsSync(dockerfilePath),
    };
  }).sort((a, b) => a.language.localeCompare(b.language) || a.framework.localeCompare(b.framework));
}
