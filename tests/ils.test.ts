import { expect, it } from 'vitest';
import { validateCatalog } from '@aserdargun/lab-core';
import { manifest, experiments, guidedLessons, initialRoute } from '../src/ils/catalog';
import concepts from '../src/ils/concepts.json';
import { learningCopy } from '../src/ui/learning';
import { VERSIONS } from '../src/experiments/config';
it('maps the current experiment and three real four-step exercises', () => {
  expect(
    validateCatalog(
      manifest,
      experiments,
      guidedLessons,
      concepts.map((c) => c.id),
    ),
  ).toEqual([]);
  expect(experiments[0].config?.experimentVersion).toBe(VERSIONS.experiment);
  expect(guidedLessons.map((l) => l.steps.map((s) => s.explanation.en))).toEqual(
    learningCopy.en.lessons.map((l) => l.steps.map((s) => s.body)),
  );
  expect(guidedLessons.map((l) => l.steps.map((s) => s.explanation.tr))).toEqual(
    learningCopy.tr.lessons.map((l) => l.steps.map((s) => s.body)),
  );
  expect(manifest.evidence.find((e) => e.id === 'metrics')?.calculatedFrom).toEqual(['world']);
});
it('sends both languages to one destination and names it as a fragment', () => {
  const en = learningCopy.en.lessons.map((l) => l.target);
  expect(learningCopy.tr.lessons.map((l) => l.target)).toEqual(en);
  // The action link is a same-page jump to a real control, never an external route.
  for (const target of en) expect(target).toMatch(/^#[a-z][a-z0-9-]*$/);
});

it('allowlists lesson routes without interpreting unsupported context or run inputs', () => {
  expect(initialRoute('?lesson=local-decisions&lang=tr')).toEqual({ lesson: 2, locale: 'tr' });
  expect(initialRoute('?lesson=constructor&ils=bad').lesson).toBe(0);
});
