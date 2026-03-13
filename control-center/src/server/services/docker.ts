import Docker from 'dockerode';
import path from 'path';
import { execSync } from 'child_process';

const docker = new Docker();
const REPO_ROOT = path.resolve(import.meta.dirname, '../../../..');

const CONTAINER_PREFIX = 'tournament-';

export interface ContainerInfo {
  port: number;
  containerId: string;
}

const runningContainers = new Map<string, ContainerInfo>();

export async function buildImage(entryId: string): Promise<{ imageSizeMb: number }> {
  const entryPath = path.join(REPO_ROOT, 'entries', entryId);
  const imageName = `${CONTAINER_PREFIX}${entryId}`;

  return new Promise((resolve, reject) => {
    docker.buildImage(
      { context: entryPath, src: ['.'] },
      { t: imageName },
      (err, stream) => {
        if (err) return reject(err);
        if (!stream) return reject(new Error('No build stream'));

        docker.modem.followProgress(stream, async (err) => {
          if (err) return reject(err);
          try {
            const image = docker.getImage(imageName);
            const info = await image.inspect();
            const sizeMb = Math.round((info.Size || 0) / 1024 / 1024 * 10) / 10;
            resolve({ imageSizeMb: sizeMb });
          } catch (e) {
            resolve({ imageSizeMb: 0 });
          }
        });
      }
    );
  });
}

export async function startContainer(entryId: string, port: number = 9000): Promise<ContainerInfo> {
  const imageName = `${CONTAINER_PREFIX}${entryId}`;
  const containerName = `${CONTAINER_PREFIX}${entryId}`;

  // Stop existing container if any
  await stopContainer(entryId);

  const container = await docker.createContainer({
    Image: imageName,
    name: containerName,
    ExposedPorts: { '8080/tcp': {} },
    HostConfig: {
      PortBindings: { '8080/tcp': [{ HostPort: String(port) }] },
    },
  });

  await container.start();
  const info = { port, containerId: container.id };
  runningContainers.set(entryId, info);
  return info;
}

export async function stopContainer(entryId: string): Promise<void> {
  const containerName = `${CONTAINER_PREFIX}${entryId}`;
  try {
    const container = docker.getContainer(containerName);
    await container.stop().catch(() => {});
    await container.remove().catch(() => {});
  } catch {
    // Container doesn't exist, ignore
  }
  runningContainers.delete(entryId);
}

export async function stopAllContainers(): Promise<void> {
  const containers = await docker.listContainers({ all: true });
  for (const c of containers) {
    if (c.Names.some(n => n.startsWith(`/${CONTAINER_PREFIX}`))) {
      const container = docker.getContainer(c.Id);
      await container.stop().catch(() => {});
      await container.remove().catch(() => {});
    }
  }
  runningContainers.clear();
}

export async function healthCheck(port: number, timeoutMs: number = 60000): Promise<number> {
  const start = Date.now();
  const url = `http://localhost:${port}/api/authors`;

  while (Date.now() - start < timeoutMs) {
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        return Date.now() - start;
      }
    } catch {
      // Not ready yet
    }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`Health check failed after ${timeoutMs}ms`);
}

export async function getMemoryUsage(entryId: string): Promise<number> {
  const containerName = `${CONTAINER_PREFIX}${entryId}`;
  try {
    const output = execSync(
      `docker stats --no-stream --format "{{.MemUsage}}" ${containerName}`,
      { encoding: 'utf-8' }
    ).trim();
    // Parse "12.5MiB / 7.77GiB" format
    const match = output.match(/([\d.]+)([A-Za-z]+)/);
    if (match) {
      const val = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      if (unit === 'gib') return Math.round(val * 1024 * 10) / 10;
      if (unit === 'mib') return Math.round(val * 10) / 10;
      if (unit === 'kib') return Math.round(val / 1024 * 10) / 10;
    }
    return 0;
  } catch {
    return 0;
  }
}

export function getRunningContainers(): Map<string, ContainerInfo> {
  return runningContainers;
}
