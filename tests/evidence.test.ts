import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { evidence, researchReviewDate } from '../src/ui/validatedRuns';
import { dictionary } from '../src/ui/i18n';
import raw from '../docs/validation-evidence.json';

it('surfaces the research review date stated in docs/RESEARCH.md', () => {
  const research = readFileSync('docs/RESEARCH.md', 'utf8');
  expect(research).toContain(researchReviewDate);
  expect(research).toMatch(/full text was not used/i);
  const noscript = readFileSync('index.html', 'utf8');
  expect(noscript).toContain(researchReviewDate);
  expect(noscript).toMatch(/tam metin kullanılmadı/);
});

it('reads the pinned evidence rows instead of restating them', () => {
  expect(evidence.runs).toHaveLength(raw.results.length);
  expect(evidence.runtime).toBe(raw.runtime);
  expect(evidence.versions).toEqual(raw.versions);
  for (const run of evidence.runs) {
    expect(run.ticks).toBe(evidence.tickBudget);
    expect(run.metrics.delivered).toBeGreaterThanOrEqual(0);
    expect(run.metrics.coverage).toBeGreaterThan(0);
    expect(run.metrics.coverage).toBeLessThanOrEqual(100);
    expect(run.ticksPerSecond).toBeGreaterThan(0);
  }
});

it('keeps the food-signal ablation honest in the pinned file', () => {
  for (const run of evidence.runs.filter((r) => r.signalGain === 0)) {
    expect(run.trail.connectedToFood).toBe(false);
  }
  for (const run of evidence.runs.filter((r) => r.signalGain === 1)) {
    expect(run.trail.connectedToFood).toBe(true);
  }
});

it('publishes the same evidence wording in both locales', () => {
  const keys = [
    'evidenceTitle',
    'evidenceLabel',
    'evidenceMachine',
    'evidenceFullText',
    'scopeTitle',
    'scopeBody',
    'siblingTitle',
    'siblingBody',
  ] as const;
  for (const key of keys) {
    expect(dictionary.en[key], key).not.toBe(dictionary.tr[key]);
    expect(dictionary.en[key].length, key).toBeGreaterThan(0);
  }
  expect(dictionary.en.evidenceLabel).toMatch(/not a biological measurement/i);
  expect(dictionary.tr.evidenceLabel).toMatch(/biyolojik ölçüm değildir/);
});
