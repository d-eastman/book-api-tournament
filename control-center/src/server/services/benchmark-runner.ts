import { execSync, exec } from 'child_process';
import type { EndpointResult, BenchmarkResult, BenchmarkConfig, BenchmarkStatus } from '../../shared/types.js';
import { BENCHMARK_ENDPOINTS } from '../../shared/types.js';
import * as dockerService from './docker.js';

const BENCHMARK_PORT = 9000;

// Mode configurations
const MODES = {
  quick: { requests: 2000, concurrency: 20, warmup: 500 },
  full: { requests: 20000, concurrency: 50, warmup: 2000 },
};

let currentStatus: BenchmarkStatus = { state: 'idle' };

export function getStatus(): BenchmarkStatus {
  return currentStatus;
}

function detectTool(): 'oha' | 'hey' | null {
  try { execSync('which oha', { stdio: 'ignore' }); return 'oha'; } catch {}
  try { execSync('which hey', { stdio: 'ignore' }); return 'hey'; } catch {}
  return null;
}

async function runOha(url: string, requests: number, concurrency: number): Promise<EndpointResult> {
  return new Promise((resolve, reject) => {
    exec(`oha -n ${requests} -c ${concurrency} --json ${url}`, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
      if (err) return reject(err);
      try {
        const data = JSON.parse(stdout);
        resolve({
          endpoint: url,
          reqPerSec: Math.round(data.summary?.requestsPerSec || 0),
          avgMs: Math.round((data.summary?.average || 0) * 1000 * 100) / 100,
          p50Ms: Math.round((data.latencyPercentiles?.p50 || 0) * 1000 * 100) / 100,
          p95Ms: Math.round((data.latencyPercentiles?.p95 || 0) * 1000 * 100) / 100,
          p99Ms: Math.round((data.latencyPercentiles?.p99 || 0) * 1000 * 100) / 100,
        });
      } catch (e) {
        reject(new Error(`Failed to parse oha output: ${e}`));
      }
    });
  });
}

async function runHey(url: string, requests: number, concurrency: number): Promise<EndpointResult> {
  return new Promise((resolve, reject) => {
    exec(`hey -n ${requests} -c ${concurrency} ${url}`, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
      if (err) return reject(err);
      try {
        const rpsMatch = stdout.match(/Requests\/sec:\s+([\d.]+)/);
        const avgMatch = stdout.match(/Average:\s+([\d.]+)\s+secs/);
        const reqPerSec = rpsMatch ? Math.round(parseFloat(rpsMatch[1])) : 0;
        const avgMs = avgMatch ? Math.round(parseFloat(avgMatch[1]) * 1000 * 100) / 100 : 0;

        resolve({
          endpoint: url,
          reqPerSec,
          avgMs,
          p50Ms: 0,
          p95Ms: 0,
          p99Ms: 0,
        });
      } catch (e) {
        reject(new Error(`Failed to parse hey output: ${e}`));
      }
    });
  });
}

async function benchmarkEndpoint(url: string, requests: number, concurrency: number): Promise<EndpointResult> {
  const tool = detectTool();
  if (!tool) throw new Error('No benchmark tool found. Install oha or hey.');
  if (tool === 'oha') return runOha(url, requests, concurrency);
  return runHey(url, requests, concurrency);
}

export async function runBenchmark(
  entryId: string,
  config: BenchmarkConfig
): Promise<BenchmarkResult> {
  const tool = detectTool();
  if (!tool) throw new Error('No benchmark tool found. Install oha or hey.');

  const modeConfig = MODES[config.mode];
  const endpoints = config.endpoints || BENCHMARK_ENDPOINTS;

  // Build
  currentStatus = { state: 'building', entryId };
  const { imageSizeMb } = await dockerService.buildImage(entryId);

  // Start
  currentStatus = { state: 'starting', entryId };
  await dockerService.startContainer(entryId, BENCHMARK_PORT);

  try {
    // Health check (also measures startup time)
    const startupMs = await dockerService.healthCheck(BENCHMARK_PORT);

    // Idle memory
    const memIdleMib = await dockerService.getMemoryUsage(entryId);

    // Warmup
    currentStatus = { state: 'warming', entryId };
    const warmupUrl = `http://localhost:${BENCHMARK_PORT}/api/authors`;
    await benchmarkEndpoint(warmupUrl, modeConfig.warmup, 10);

    // Benchmark each endpoint
    const results: Record<string, EndpointResult> = {};
    for (let i = 0; i < endpoints.length; i++) {
      const ep = endpoints[i];
      currentStatus = {
        state: 'benchmarking',
        entryId,
        endpoint: ep,
        progress: `${i + 1}/${endpoints.length}`,
      };

      // Convert endpoint spec to URL
      const epPath = ep.replace(/^(GET|POST)\s+/, '');
      const url = `http://localhost:${BENCHMARK_PORT}${epPath}`;
      const result = await benchmarkEndpoint(url, modeConfig.requests, modeConfig.concurrency);

      // Normalize endpoint name
      const epKey = ep.replace(/[\/\?=&\s]/g, '_').replace(/^(GET|POST)_/, '').replace(/_+/g, '_').replace(/^_|_$/g, '');
      results[epKey] = { ...result, endpoint: ep };
    }

    // Loaded memory
    const memLoadedMib = await dockerService.getMemoryUsage(entryId);

    const benchmarkResult: BenchmarkResult = {
      entryId,
      timestamp: new Date().toISOString(),
      mode: config.mode,
      dataSize: config.dataSize,
      startupMs,
      imageSizeMb,
      memIdleMib,
      memLoadedMib,
      endpoints: results,
    };

    return benchmarkResult;
  } finally {
    // Always stop container
    await dockerService.stopContainer(entryId);
  }
}

export async function runBatchBenchmark(
  entryIds: string[],
  config: BenchmarkConfig
): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];

  for (const entryId of entryIds) {
    const result = await runBenchmark(entryId, config);
    results.push(result);
  }

  currentStatus = { state: 'complete', results };
  return results;
}

export function resetStatus(): void {
  currentStatus = { state: 'idle' };
}
