import { expect, it, vi } from 'vitest';
import { waitForExpectedCommit } from '../scripts/release-readiness';

it('waits through stale manifests and returns the expected release without another delay', async () => {
  const current = { commit: 'new', files: ['worker.js'] };
  const read = vi.fn().mockResolvedValueOnce({ commit: 'old' }).mockResolvedValueOnce(current);
  const sleep = vi.fn(async () => {});
  const report = vi.fn();
  expect(await waitForExpectedCommit(read, 'new', { sleep, report })).toBe(current);
  expect(read).toHaveBeenCalledTimes(2);
  expect(sleep).toHaveBeenCalledExactlyOnceWith(5000);
  expect(report).toHaveBeenCalledWith(expect.stringContaining('expected new, received old'));
});

it('does not wait when the first manifest already matches', async () => {
  const read = vi.fn().mockResolvedValue({ commit: 'new' });
  const sleep = vi.fn(async () => {});
  await waitForExpectedCommit(read, 'new', { sleep });
  expect(read).toHaveBeenCalledTimes(1);
  expect(sleep).not.toHaveBeenCalled();
});

it('fails after the bounded number of stale responses instead of accepting another commit', async () => {
  const read = vi.fn().mockResolvedValue({ commit: 'old' });
  const sleep = vi.fn(async () => {});
  await expect(
    waitForExpectedCommit(read, 'new', { maxAttempts: 3, sleep, report: () => {} }),
  ).rejects.toThrow('after 3 checks: expected new, received old');
  expect(read).toHaveBeenCalledTimes(3);
  expect(sleep).toHaveBeenCalledTimes(2);
});

it('preserves response-validation failures rather than retrying or hiding them', async () => {
  const failure = new Error('Invalid release response');
  const read = vi.fn().mockRejectedValue(failure);
  const sleep = vi.fn(async () => {});
  await expect(waitForExpectedCommit(read, 'new', { sleep })).rejects.toBe(failure);
  expect(read).toHaveBeenCalledTimes(1);
  expect(sleep).not.toHaveBeenCalled();
});

it.each([0, -1, 1.5, Infinity])(
  'rejects an invalid attempt limit %s before any request',
  async (maxAttempts) => {
    const read = vi.fn();
    await expect(waitForExpectedCommit(read, 'new', { maxAttempts })).rejects.toThrow(
      'attempt limit',
    );
    expect(read).not.toHaveBeenCalled();
  },
);
