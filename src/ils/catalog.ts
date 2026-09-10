import {
  parseManifest,
  type ExperimentDefinition,
  type LessonDefinition,
} from '@aserdargun/lab-core';
import raw from '../../lab.manifest.json';
import rawExperiments from './experiments.json';
import { learningCopy } from '../ui/learning';
export const manifest = parseManifest(raw);
export const experiments = rawExperiments as ExperimentDefinition<{ experimentVersion: string }>[];
export const guidedLessons: LessonDefinition[] = manifest.lessons!.map((ref, i) => ({
  schemaVersion: '0.1',
  id: ref.id,
  title: ref.title,
  concepts: manifest.concepts,
  steps: learningCopy.en.lessons[i].steps.map((step, j) => ({
    id: `step-${j + 1}`,
    title: { en: step.title, tr: learningCopy.tr.lessons[i].steps[j].title },
    explanation: { en: step.body, tr: learningCopy.tr.lessons[i].steps[j].body },
    experimentId: 'local-foraging',
    completion: { kind: 'manual' },
  })),
}));
export function initialRoute(search: string) {
  const p = new URLSearchParams(search);
  return {
    lesson: Math.max(
      0,
      guidedLessons.findIndex((l) => l.id === p.get('lesson')),
    ),
    locale:
      p.get('lang') === 'tr'
        ? ('tr' as const)
        : p.get('lang') === 'en'
          ? ('en' as const)
          : undefined,
  };
}
