import { test, expect } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Simulation } from '../src/simulation/simulation';
import { defaultConfig } from '../src/experiments/config';
import type { SimulationSnapshot } from '../src/simulation/types';
import AxeBuilder from '@axe-core/playwright';

declare global {
  interface Window {
    __antSnapshot?: SimulationSnapshot;
  }
}

test.beforeEach(async ({ page }) => {
  // Test-only instrumentation observes the real production worker without app debug APIs.
  await page.addInitScript(() => {
    const Base = window.Worker;
    window.Worker = class extends Base {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        this.addEventListener('message', (event) => {
          if (event.data.type === 'snapshot') window.__antSnapshot = event.data.snapshot;
        });
      }
    };
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeVisible();
});

test('production worker exactly matches headless state, exports and replays at tick 6000', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.locator('.run-tools summary').click();
  await page.getByLabel('Run N ticks', { exact: true }).fill('6000');
  await page.getByRole('button', { name: 'Run ticks', exact: true }).click();
  await expect(page.getByTestId('tick')).toHaveText('6,000', { timeout: 30000 });
  const sim = new Simulation(defaultConfig());
  sim.stepMany(6000);
  const browserState = await page.evaluate(() => JSON.stringify(window.__antSnapshot));
  expect(createHash('sha256').update(browserState).digest('hex')).toBe(
    createHash('sha256').update(JSON.stringify(sim.snapshot())).digest('hex'),
  );
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export run', exact: true }).click();
  const file = info.outputPath('run.json');
  await (await download).saveAs(file);
  const record = JSON.parse(await readFile(file, 'utf8'));
  expect(record).toEqual(sim.exportRun());
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByTestId('tick')).toHaveText('0');
  await page.getByLabel('Import & replay', { exact: true }).setInputFiles(file);
  await expect(page.getByTestId('tick')).toHaveText('6,000', { timeout: 30000 });
  expect(await page.evaluate(() => JSON.stringify(window.__antSnapshot))).toBe(browserState);
  await page.locator('.run-tools summary').click();
  await mkdir('.local', { recursive: true });
  await page.screenshot({ path: '.local/desktop.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('pause, exact stepping, speed, parameter restart and hypothesis retention', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Step', exact: true }).click();
  await expect(page.getByTestId('tick')).toHaveText('1');
  await page.getByRole('button', { name: '20×', exact: true }).click();
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect
    .poll(async () => Number((await page.getByTestId('tick').innerText()).replaceAll(',', '')))
    .toBeGreaterThan(100);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeVisible();
  const paused = await page.getByTestId('tick').innerText();
  await page.waitForTimeout(150);
  expect(await page.getByTestId('tick').innerText()).toBe(paused);
  await page.locator('.hypothesis summary').click();
  await page
    .getByLabel('What changes when the colony forgets faster?', { exact: true })
    .fill('I predict a weaker food trail.');
  const evaporation = page.getByRole('slider', { name: 'Food evaporation', exact: true });
  await evaporation.focus();
  await evaporation.press('Home');
  for (let i = 0; i < 9; i++) await evaporation.press('ArrowRight');
  await page.getByRole('button', { name: 'Apply & restart', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.__antSnapshot?.config.fields.food.evaporation))
    .toBe(0.01);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.locator('.hypothesis summary').click();
  await expect(
    page.getByLabel('What changes when the colony forgets faster?', { exact: true }),
  ).toHaveValue('I predict a weaker food trail.');
  await expect(page.getByLabel('Seed', { exact: true })).toHaveValue('58392041');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByTestId('tick')).toHaveText('0');
});

test('layers, keyboard ant inspector, follow, pan/fit, seed and methodology', async ({ page }) => {
  await page.getByRole('button', { name: 'Step', exact: true }).click();
  for (const layer of ['Natural', 'Food signal', 'Home signal', 'Combined']) {
    const button = page.getByRole('button', { name: layer, exact: true });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  }
  await page.getByLabel('Select ant', { exact: true }).selectOption('10');
  await expect(page.locator('.ant-details')).toBeVisible();
  await page.getByRole('button', { name: 'Follow ant', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Stop following', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByLabel('Show sensors', { exact: true }).check();
  const canvas = page.locator('canvas'),
    box = (await canvas.boundingBox())!;
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(page.locator('.ant-details')).toBeVisible();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.getByRole('button', { name: 'Fit', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Follow ant', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await page.getByLabel('Seed', { exact: true }).fill('42');
  await page.getByLabel('Seed', { exact: true }).press('Enter');
  await expect.poll(() => page.evaluate(() => window.__antSnapshot?.config.seed)).toBe(42);
  await page.getByRole('button', { name: 'Methodology', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'New seed', exact: true }).click();
  await expect.poll(() => page.getByLabel('Seed', { exact: true }).inputValue()).not.toBe('42');
});

test('mobile EN/TR retains useful controls without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'TR', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  await expect(page.getByRole('heading', { name: 'İlk iz.', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.getByRole('button', { name: 'Bir adım', exact: true }).click();
  await expect(page.getByTestId('tick')).toHaveText('1');
  await page.getByLabel('Karınca seç', { exact: true }).selectOption('0');
  await expect(page.locator('.ant-details')).toBeVisible();
  await page.screenshot({ path: '.local/mobile-tr.png', fullPage: true });
  await page.getByRole('button', { name: 'Yöntem', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.getByRole('button', { name: 'Kapat', exact: true }).click();
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'The first trail.', exact: true })).toBeVisible();
});

test('invalid imports fail clearly and preserve the active run', async ({ page }) => {
  await page.getByRole('button', { name: 'Step', exact: true }).click();
  await page.locator('.run-tools summary').click();
  await page.getByLabel('Import & replay', { exact: true }).setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"versions":{"schema":99}}'),
  });
  await expect(page.getByRole('alert')).toContainText('unsupported model version');
  await expect(page.getByTestId('tick')).toHaveText('1');
});

test('ordinary first visit starts at zero with a living colony', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__antSnapshot?.tick ?? 0)).toBeGreaterThan(10);
  expect(await page.evaluate(() => window.__antSnapshot!.fields.food.every((x) => x === 0))).toBe(
    true,
  );
});

test('desktop and Turkish mobile pass automated accessibility checks', async ({ page }) => {
  let scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(scan.violations).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'TR', exact: true }).click();
  scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(scan.violations).toEqual([]);
});

test('imported full-range parameters remain editable and a smaller world fits automatically', async ({
  page,
}) => {
  const config = defaultConfig(7);
  config.population = 1500;
  config.fields.food.evaporation = 0;
  config.brain.exploration = 0.12345;
  config.world = {
    width: 240,
    height: 180,
    cellSize: 6,
    nest: { x: 40, y: 120, radius: 10, colonyId: 0 },
    foods: [{ id: 0, x: 190, y: 45, radius: 8, amount: 100 }],
    obstacles: [],
  };
  const run = new Simulation(config).exportRun();
  await page.getByLabel('Select ant', { exact: true }).selectOption('0');
  await page.getByRole('button', { name: 'Follow ant', exact: true }).click();
  await page.locator('.run-tools summary').click();
  await page.getByLabel('Import & replay', { exact: true }).setInputFiles({
    name: 'custom.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(run)),
  });
  await expect(page.getByRole('spinbutton', { name: 'Population', exact: true })).toHaveValue(
    '1500',
  );
  await expect(page.getByRole('spinbutton', { name: 'Food evaporation', exact: true })).toHaveValue(
    '0',
  );
  await expect(page.getByRole('spinbutton', { name: 'Exploration', exact: true })).toHaveValue(
    '0.12345',
  );
  await expect(page.getByLabel('Select ant', { exact: true })).toHaveValue('');
  // Food center must be in its fitted camera position, not offscreen at the old world's center.
  await expect
    .poll(() =>
      page.locator('canvas').evaluate((element) => {
        const canvas = element as HTMLCanvasElement;
        const box = canvas.getBoundingClientRect(),
          scale = Math.min(box.width / 240, box.height / 180);
        const ratio = canvas.width / box.width;
        const p = canvas
          .getContext('2d')!
          .getImageData(
            Math.round((box.width / 2 + 70 * scale) * ratio),
            Math.round((box.height / 2 - 45 * scale) * ratio),
            1,
            1,
          ).data;
        return p[0] > 170 && p[1] > 100 && p[2] < 150;
      }),
    )
    .toBe(true);
});
