import { test, expect } from '@playwright/test';
import { defaultConfig } from '../src/experiments/config';
import type { WorkerUpdate } from '../src/worker/protocol';

test('large colonies keep timing records small and controls responsive', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('crash', () => errors.push('Renderer crashed'));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeVisible();
  const population = page.getByRole('slider', { name: 'Population', exact: true });
  await population.focus();
  await population.press('End');
  await page.getByRole('button', { name: 'Apply & restart', exact: true }).click();
  await page.getByRole('button', { name: '100×', exact: true }).click();
  await expect
    .poll(async () => Number((await page.getByTestId('tick').innerText()).replaceAll(',', '')), {
      timeout: 30000,
    })
    .toBeGreaterThan(10000);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeVisible();
  const paused = Number((await page.getByTestId('tick').innerText()).replaceAll(',', ''));
  await page.waitForTimeout(150);
  expect(Number((await page.getByTestId('tick').innerText()).replaceAll(',', ''))).toBe(paused);

  // The previous development build stored ~3.9 MB per WorldView/Inspectors measure,
  // then failed with DataCloneError/out of memory. Do not clear or disable profiling:
  // verify that its real retained payload stays small, with React development checks on.
  const timing = await page.evaluate(() => {
    const sizes = performance.getEntriesByType('measure').map((entry) => {
      return JSON.stringify((entry as PerformanceMeasure).detail)?.length ?? 0;
    });
    return { largest: Math.max(0, ...sizes), total: sizes.reduce((sum, size) => sum + size, 0) };
  });
  expect(timing.largest).toBeLessThan(100000);
  expect(timing.total).toBeLessThan(10000000);
  await page.getByRole('button', { name: 'Step', exact: true }).click();
  await expect(page.getByTestId('tick')).toHaveText((paused + 1).toLocaleString('en-US'));
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByTestId('tick')).toHaveText('0');
  await page.getByLabel('Select ant', { exact: true }).selectOption('999');
  await expect(page.locator('.ant-details')).toBeVisible();
  expect(errors).toEqual([]);
});

test('a stalled view holds one frame, rejects stale acknowledgments and receives the latest reset', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const Base = window.Worker;
    window.Worker = class extends Base {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        document.documentElement.dataset.workerUrl = String(url);
      }
    };
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeVisible();
  const result = await page.evaluate(async (config) => {
    // A second real worker lets us deliberately withhold frame acknowledgments without
    // changing the application's renderer, timers, or scientific kernel.
    const worker = new Worker(document.documentElement.dataset.workerUrl!, { type: 'module' });
    const frames: Extract<WorkerUpdate, { type: 'snapshot' }>[] = [];
    const errors: string[] = [];
    worker.onmessage = ({ data }: MessageEvent<WorkerUpdate>) => {
      if (data.type === 'snapshot') frames.push(data);
      if (data.type === 'error') errors.push(data.message);
    };
    worker.onerror = (error) => errors.push(error.message);
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const waitFor = async (predicate: () => boolean) => {
      const start = performance.now();
      while (!predicate()) {
        if (performance.now() - start > 5000) throw new Error('Worker response timed out');
        await delay(10);
      }
    };
    try {
      worker.postMessage({ type: 'reset', config, play: false });
      await waitFor(() => frames.length === 1);
      worker.postMessage({ type: 'run', ticks: 240 });
      await delay(1000);
      const stalledCount = frames.length;
      worker.postMessage({ type: 'ack', sequence: -1 });
      await delay(100);
      const invalidAckCount = frames.length;
      worker.postMessage({ type: 'ack', sequence: frames[0].sequence });
      await waitFor(() => frames.length === 2);
      const completed = {
        tick: frames[1].snapshot.tick,
        remaining: frames[1].status.remainingTicks,
      };

      for (let seed = 10; seed <= 20; seed++) {
        worker.postMessage({ type: 'reset', config: { ...config, seed }, play: false });
      }
      // Message ordering ensures this export is a barrier after the reset commands.
      const exported = new Promise<void>((resolve) => {
        worker.addEventListener('message', ({ data }) => {
          if (data.type === 'export') resolve();
        });
      });
      worker.postMessage({ type: 'export' });
      await exported;
      const resetCount = frames.length;
      worker.postMessage({ type: 'ack', sequence: frames[0].sequence });
      await delay(100);
      const staleAckCount = frames.length;
      worker.postMessage({ type: 'ack', sequence: frames[1].sequence });
      await waitFor(() => frames.length === 3);
      return {
        stalledCount,
        invalidAckCount,
        completed,
        resetCount,
        staleAckCount,
        final: { tick: frames[2].snapshot.tick, seed: frames[2].snapshot.config.seed },
        errors,
      };
    } finally {
      worker.terminate();
    }
  }, defaultConfig());
  expect(result).toEqual({
    stalledCount: 1,
    invalidAckCount: 1,
    completed: { tick: 240, remaining: 0 },
    resetCount: 2,
    staleAckCount: 2,
    final: { tick: 0, seed: 20 },
    errors: [],
  });
});
