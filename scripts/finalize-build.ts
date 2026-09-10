import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { VERSIONS } from '../src/experiments/config';

async function collect(directory: string): Promise<string[]> {
  const paths: string[] = [];
  for (const file of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${file.name}`;
    if (file.isDirectory()) paths.push(...(await collect(path)));
    else paths.push(path.slice('dist/'.length));
  }
  return paths.sort();
}

const paths = await collect('dist');
const html = await readFile('dist/index.html', 'utf8');
assert(html.includes('ANT - Ant Colony Intelligence Laboratory'));
assert(!html.includes('/src/main.tsx'));
for (const [, path] of html.matchAll(/(?:src|href)="\/(.*?)"/g))
  assert(paths.includes(path), `Missing entry asset: ${path}`);
assert(
  paths.some((path) => /^assets\/entry-.*\.js$/.test(path)),
  'Missing module Worker',
);
assert(!paths.some((path) => /\.(?:map|tsx?)$/.test(path)), 'Source files in deploy artifact');
const config = JSON.parse(await readFile('dist/staticwebapp.config.json', 'utf8'));
assert(config.globalHeaders['Content-Security-Policy'].includes("worker-src 'self'"));
let commit = process.env.GITHUB_SHA;
if (!commit) {
  try {
    commit = execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    commit = 'local';
  }
}
assert(commit === 'local' || /^[a-f0-9]{40}$/.test(commit), 'Invalid release commit');
// A local build may contain edits beyond HEAD. Never label it as an exact commit artifact.
let sourceDirty = true;
try {
  sourceDirty =
    execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().length > 0;
} catch {
  // Without a repository there is no verified source identity.
}
const files = await Promise.all(
  paths
    .filter((path) => !['staticwebapp.config.json', 'release.json'].includes(path))
    .map(async (path) => {
      const bytes = await readFile(`dist/${path}`);
      return {
        path,
        bytes: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      };
    }),
);
const bytes = files.reduce((sum, file) => sum + file.bytes, 0);
assert(bytes < 250 * 1024 * 1024, 'Artifact exceeds Free plan size limit');
await writeFile(
  'dist/release.json',
  `${JSON.stringify({ application: 'ANT', commit, sourceDirty, builtAt: new Date().toISOString(), versions: VERSIONS, files }, null, 2)}\n`,
);
console.log(
  `Verified static artifact: ${files.length} public files, ${bytes} bytes, commit ${commit}${sourceDirty ? ' (local modifications)' : ''}`,
);
