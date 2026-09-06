import { expect, it } from 'vitest';
import { RuleBasedBrain } from '../src/simulation/brain';
import { SeededRandom } from '../src/simulation/prng';
import type { Observation } from '../src/simulation/types';

it('E: follows a local gradient and ignores it when signal sensing is disabled', () => {
  const observation: Observation = {
    heading: 0,
    state: 'searching',
    targetBearing: null,
    homeBearing: Math.PI,
    exploration: 0,
    signalGain: 1,
    probes: [-0.6, 0, 0.6].map((angle, i) => ({
      angle,
      food: i === 2 ? 4 : 0,
      home: 0,
      blocked: false,
    })),
  };
  const brain = new RuleBasedBrain();
  expect(brain.decide(observation, new SeededRandom(12))).toEqual({
    heading: 0.22,
    reason: 'signal',
  });
  expect(brain.decide({ ...observation, signalGain: 0 }, new SeededRandom(12)).reason).toBe(
    'explore',
  );
  const mirrored = {
    ...observation,
    probes: observation.probes.map((p) => ({ ...p, food: p.angle < 0 ? 4 : 0 })),
  };
  expect(brain.decide(mirrored, new SeededRandom(12)).heading).toBe(-0.22);
  for (const level of [1, 100]) {
    const flat = { ...observation, probes: observation.probes.map((p) => ({ ...p, food: level })) };
    expect(brain.decide(flat, new SeededRandom(12)).heading).toBe(0);
  }
});
