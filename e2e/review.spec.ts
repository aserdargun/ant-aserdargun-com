import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { defaultConfig } from '../src/experiments/config';
import { Simulation } from '../src/simulation/simulation';

test('rejected imports preserve selected ant, follow state and parameter drafts in both languages', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Step', exact: true }).click();
  await page.getByLabel('Select ant', { exact: true }).selectOption('10');
  await page.getByRole('button', { name: 'Follow ant', exact: true }).click();
  await page.getByRole('slider', { name: 'Population', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await page.locator('.run-tools summary').click();
  for (const language of ['EN', 'TR']) {
    await page.getByRole('button', { name: language, exact: true }).click();
    await page.locator('input[type=file]').setInputFiles({
      name: 'unsupported.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"versions":{"schema":99}}'),
    });
    await expect(page.getByRole('alert')).toContainText(
      language === 'EN' ? 'unsupported model version' : 'desteklenmeyen',
    );
    await expect(page.locator('#ant-select')).toHaveValue('10');
    await expect(page.locator('.follow-button')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#population')).toHaveValue('110');
    await expect(page.getByTestId('tick')).toHaveText('1');
  }
});

test('worker message failure recovers from an imported large colony and clears its selection', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const Base = window.Worker;
    window.Worker = class extends Base {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        window.addEventListener('ant-test-message-failure', () =>
          this.dispatchEvent(new MessageEvent('messageerror')),
        );
      }
    };
  });
  await page.goto('/');
  await page.locator('.run-tools summary').click();
  const config = defaultConfig();
  config.population = 1500;
  await page.locator('input[type=file]').setInputFiles({
    name: 'large.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(new Simulation(config).exportRun())),
  });
  await page.locator('#ant-select').selectOption('1499');
  await page.getByRole('button', { name: 'Follow ant', exact: true }).click();
  await page.evaluate(() => window.dispatchEvent(new Event('ant-test-message-failure')));
  await expect(page.getByRole('button', { name: 'Retry simulation', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Retry simulation', exact: true }).click();
  await expect(page.locator('#ant-select')).toHaveValue('');
  await expect(page.locator('#population')).toHaveValue('100');
  await page.getByRole('button', { name: 'Step', exact: true }).click();
  await expect(page.getByTestId('tick')).toHaveText('1');
});

test('custom world is identified and zero deposition is not described as a chemical trail', async ({
  page,
}) => {
  const config = defaultConfig(7);
  config.population = 1;
  config.fields.food.deposit = 0;
  config.world.foods = [{ id: 0, x: 210, y: 440, radius: 8, amount: 20 }];
  config.world.obstacles = [];
  const sim = new Simulation(config);
  sim.stepMany(1500);
  await page.goto('/');
  await page.locator('.run-tools summary').click();
  await page.locator('input[type=file]').setInputFiles({
    name: 'no-signal.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(sim.exportRun())),
  });
  await expect(page.getByTestId('tick')).toHaveText('1,500');
  await expect(page.locator('.experiment-meta')).toContainText('Custom world');
  await expect(page.locator('.insight')).toContainText('Food-signal deposition is disabled');
  await page.getByRole('button', { name: 'TR', exact: true }).click();
  await expect(page.locator('.insight')).toContainText('Besin izi bırakma kapalı');
});

test('all glossary dialogs, lesson answers and narrow layouts preserve a paused run', async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Step', exact: true }).click();
  for (const language of ['EN', 'TR']) {
    await page.getByRole('button', { name: language, exact: true }).click();
    for (const width of [320, 390, 768, 1024, 1536]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    }
    for (const button of await page.locator('.lesson-picker button').all()) {
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await page.locator('.understanding-check summary').click();
      await expect(page.locator('.understanding-check details p')).toBeVisible();
    }
    await page.locator('.glossary').evaluate((el) => {
      (el as HTMLDetailsElement).open = true;
    });
    const terms = page.locator('.glossary .term-link');
    await expect(terms).toHaveCount(26);
    for (const button of await terms.all()) {
      await button.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.locator('#term-definition')).not.toBeEmpty();
      await page.keyboard.press('Escape');
      await expect(button).toBeFocused();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await terms.first().click();
    const scan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(scan.violations).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('tick')).toHaveText('1');
  }
  expect(errors).toEqual([]);
});

test('keyboard camera controls redraw a paused world without changing the experiment', async ({
  page,
}) => {
  await page.goto('/');
  const canvas = page.locator('canvas');
  await expect(page.getByTestId('tick')).toHaveText('0');
  const pixels = () => canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL());
  await canvas.focus();
  // A paused canvas does not redraw when fonts finish loading. Fit once with
  // loaded fonts before capturing the baseline for subsequent camera actions.
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await canvas.press('Home');
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  });
  const before = await pixels();
  await canvas.press('+');
  await expect.poll(pixels).not.toBe(before);
  const zoomed = await pixels();
  await canvas.press('ArrowRight');
  await expect.poll(pixels).not.toBe(zoomed);
  await canvas.press('Home');
  await expect.poll(pixels).toBe(before);
  await canvas.press('+');
  await expect.poll(pixels).not.toBe(before);
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect.poll(pixels).toBe(before);
  await expect(page.getByTestId('tick')).toHaveText('0');
});
