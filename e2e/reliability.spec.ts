import { test, expect } from '@playwright/test';
import { Simulation } from '../src/simulation/simulation';
import { defaultConfig } from '../src/experiments/config';

test('tick input validates the remaining budget and Enter executes an exact run', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Step', exact: true }).click();
  await page.locator('.run-tools summary').click();
  const ticks = page.getByLabel('Run N ticks', { exact: true });
  for (const value of ['', '-1', '1.5', '100000']) {
    await ticks.fill(value);
    await page.getByRole('button', { name: 'Run ticks', exact: true }).click();
    expect(await ticks.evaluate((input: HTMLInputElement) => input.checkValidity())).toBe(false);
    await expect(page.getByTestId('tick')).toHaveText('1');
  }
  await ticks.fill('90');
  await ticks.press('Enter');
  await expect(page.getByTestId('tick')).toHaveText('91');
  await expect(page.locator('#run-budget')).toContainText('99,909');
  await page.locator('.metric-details summary').click();
  await expect(
    page.locator('.metric-details dl > div').filter({ hasText: 'Actual ticks/s' }).locator('dd'),
  ).toHaveText('0');
});

test('Turkish invalid geometry errors preserve the inspector and parameter drafts', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeVisible();
  await page.getByLabel('Select ant', { exact: true }).selectOption('5');
  const population = page.getByRole('slider', { name: 'Population', exact: true });
  await population.focus();
  await population.press('ArrowRight');
  await page.getByRole('button', { name: 'TR', exact: true }).click();
  await page.locator('.run-tools summary').click();
  const run = new Simulation(defaultConfig()).exportRun();
  run.config.world.nest.x = -20;
  await page.getByLabel('İçe aktar ve tekrar et', { exact: true }).setInputFiles({
    name: 'invalid-world.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(run)),
  });
  await expect(page.getByRole('alert')).toContainText('Mevcut deney korunuyor');
  await expect(page.getByLabel('Karınca seç', { exact: true })).toHaveValue('5');
  await expect(page.getByRole('slider', { name: 'Popülasyon', exact: true })).toHaveValue('110');
  await expect(page.getByRole('group', { name: 'Hız', exact: true })).toBeVisible();
});

test('a worker startup failure has a recoverable interface instead of a blank page', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const Base = window.Worker;
    window.Worker = class extends Base {
      constructor(url: string | URL, options?: WorkerOptions) {
        if (!sessionStorage.getItem('ant-test-worker-ready'))
          throw new Error('Test startup failure');
        super(url, options);
      }
    };
  });
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('simulation engine could not start');
  await expect(page.getByRole('heading', { name: 'The first trail.', exact: true })).toBeVisible();
  await page.evaluate(() => sessionStorage.setItem('ant-test-worker-ready', '1'));
  await page.getByRole('button', { name: 'Retry simulation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Step', exact: true }).click();
  await expect(page.getByTestId('tick')).toHaveText('1');
  expect(errors).toEqual([]);
});

test('pinch zoom preserves selection and pointer cancellation ends a drag', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeVisible();
  await page.getByLabel('Select ant', { exact: true }).selectOption('10');
  const canvas = page.locator('canvas');
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  const session = await page.context().newCDPSession(page);
  const touch = (x: number, id: number) => ({ x: box.x + x, y: box.y + box.height / 2, id });
  // Compare model pixels, excluding hover/focus styles on the overlaid camera buttons.
  const pixels = () => canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL());
  // Fit with loaded fonts: a paused canvas does not redraw on font load alone.
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.getByRole('button', { name: 'Fit', exact: true }).click();
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  });
  const before = await pixels();
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [touch(140, 1), touch(220, 2)],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [touch(100, 1), touch(260, 2)],
  });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.getByLabel('Select ant', { exact: true })).toHaveValue('10');
  await expect.poll(pixels).not.toBe(before);
  await page.getByRole('button', { name: 'Fit', exact: true }).click();
  await expect.poll(pixels).toBe(before);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [touch(140, 1)],
  });
  await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await page.mouse.move(box.x + 220, box.y + box.height / 2);
  expect(await pixels()).toBe(before);
  await session.detach();
});
