import fs from 'fs';
import path from 'path';
import type { BenchmarkResult, Tournament, SavedResult } from '../../shared/types.js';

const REPO_ROOT = path.resolve(import.meta.dirname, '../../../..');
const RESULTS_DIR = path.join(REPO_ROOT, 'results');

function ensureResultsDir(): void {
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
}

function sanitizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function saveBatchResults(name: string, results: BenchmarkResult[]): string {
  ensureResultsDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `batch-${sanitizeName(name)}-${timestamp}.csv`;
  const filepath = path.join(RESULTS_DIR, filename);

  const headers = 'timestamp,name,entryId,language,framework,dataSize,mode,endpoint,reqPerSec,avgMs,p50Ms,p95Ms,p99Ms,startupMs,memIdleMib,memLoadedMib,imageSizeMb\n';
  let csv = headers;

  for (const result of results) {
    for (const [, ep] of Object.entries(result.endpoints)) {
      csv += [
        result.timestamp,
        name,
        result.entryId,
        '', // language — filled by consumer
        '', // framework — filled by consumer
        result.dataSize,
        result.mode,
        ep.endpoint,
        ep.reqPerSec,
        ep.avgMs,
        ep.p50Ms,
        ep.p95Ms,
        ep.p99Ms,
        result.startupMs,
        result.memIdleMib,
        result.memLoadedMib,
        result.imageSizeMb,
      ].join(',') + '\n';
    }
  }

  fs.writeFileSync(filepath, csv);
  return filename;
}

export function saveTournamentResults(tournament: Tournament): string {
  ensureResultsDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `tournament-${sanitizeName(tournament.name)}-${timestamp}.csv`;
  const filepath = path.join(RESULTS_DIR, filename);

  const headers = 'timestamp,tournamentName,metric,dataSize,mode,round,matchupId,entry1,entry2,entry1Score,entry2Score,winner,bye\n';
  let csv = headers;

  for (const round of tournament.rounds) {
    for (const matchup of round.matchups) {
      csv += [
        tournament.createdAt,
        tournament.name,
        tournament.metric,
        tournament.dataSize,
        tournament.mode,
        round.round,
        matchup.id,
        matchup.entry1 || '',
        matchup.entry2 || '',
        matchup.entry1Score ?? '',
        matchup.entry2Score ?? '',
        matchup.winner || '',
        matchup.bye,
      ].join(',') + '\n';
    }
  }

  fs.writeFileSync(filepath, csv);
  return filename;
}

export function listResults(): SavedResult[] {
  ensureResultsDir();
  const files = fs.readdirSync(RESULTS_DIR).filter(f => f.endsWith('.csv')).sort().reverse();

  return files.map(filename => {
    const isTournament = filename.startsWith('tournament-');
    const type = isTournament ? 'tournament' as const : 'batch' as const;
    // Extract name and date from filename
    const parts = filename.replace('.csv', '').split('-');
    const dateStr = parts.slice(-3).join('-');
    const nameParts = parts.slice(1, -3);
    const name = nameParts.join(' ');

    return { filename, type, name, date: dateStr };
  });
}

export function getResultFile(filename: string): string {
  const filepath = path.join(RESULTS_DIR, filename);
  if (!fs.existsSync(filepath)) throw new Error(`Result file ${filename} not found`);
  return fs.readFileSync(filepath, 'utf-8');
}

export function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
}
