import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const origin = new URL(process.argv[2]);
assert(origin.protocol === 'https:', 'Live verification requires HTTPS');
const expected =
  process.argv[3] || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const releaseResponse = await fetch(new URL('/release.json', origin), {
  signal: AbortSignal.timeout(20000),
});
assert.equal(releaseResponse.status, 200);
assert(releaseResponse.headers.get('content-type')?.includes('application/json'));
assert(releaseResponse.headers.get('cache-control')?.includes('no-store'));
const release = await releaseResponse.json();
assert.equal(release.application, 'ANT');
assert.equal(release.commit, expected);
assert(release.files.length > 0);
for (const file of release.files) {
  assert(!file.path.includes('..') && !file.path.startsWith('/'), 'Unsafe manifest path');
  const response = await fetch(new URL(`/${file.path}`, origin), {
    signal: AbortSignal.timeout(20000),
  });
  assert.equal(response.status, 200, file.path);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.length, file.bytes, file.path);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, file.path);
  const type = response.headers.get('content-type') || '';
  if (file.path.endsWith('.js')) assert(type.includes('javascript'), `${file.path}: ${type}`);
  if (file.path.endsWith('.css')) assert(type.includes('text/css'), `${file.path}: ${type}`);
  if (file.path.endsWith('.woff2')) assert(type.includes('font/woff2'), `${file.path}: ${type}`);
  if (file.path === 'index.html') {
    assert(type.includes('text/html'));
    assert(response.headers.get('content-security-policy')?.includes("worker-src 'self'"));
    assert(bytes.toString().includes('ANT - Ant Colony Intelligence Laboratory'));
  }
}
assert.equal((await fetch(new URL('/assets/missing-worker.js', origin))).status, 404);
console.log(
  `Verified HTTPS release ${release.commit}: ${release.files.length} asset hashes and MIME types match.`,
);
