import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

interface ReadinessOptions {
  maxAttempts?: number;
  delayMs?: number;
  sleep?: (milliseconds: number) => Promise<void>;
  report?: (message: string) => void;
}

// Azure can acknowledge an upload before its public manifest has switched releases.
// Retry only an old commit; malformed responses and subsequent asset failures stay fatal.
export async function waitForExpectedCommit<T extends { commit: string }>(
  readRelease: () => Promise<T>,
  expected: string,
  { maxAttempts = 13, delayMs = 5000, sleep = delay, report = console.log }: ReadinessOptions = {},
): Promise<T> {
  assert(Number.isInteger(maxAttempts) && maxAttempts > 0, 'Invalid release attempt limit');
  assert(Number.isFinite(delayMs) && delayMs >= 0, 'Invalid release polling delay');
  for (let attempt = 1; ; attempt++) {
    const release = await readRelease();
    if (release.commit === expected) return release;
    assert(
      attempt < maxAttempts,
      `Release did not converge after ${maxAttempts} checks: expected ${expected}, received ${release.commit}`,
    );
    report(
      `Release propagation ${attempt}/${maxAttempts}: expected ${expected}, received ${release.commit}; checking again in ${delayMs} ms.`,
    );
    await sleep(delayMs);
  }
}
