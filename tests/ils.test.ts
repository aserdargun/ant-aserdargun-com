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
it('allowlists lesson routes without interpreting unsupported context or run inputs', () => {
  expect(initialRoute('?lesson=local-decisions&lang=tr')).toEqual({ lesson: 2, locale: 'tr' });
  expect(initialRoute('?lesson=constructor&ils=bad').lesson).toBe(0);
});
