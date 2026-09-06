import { describe, expect, it } from 'vitest';
import { SeededRandom } from '../src/simulation/prng';

describe('Mulberry32', () => {
  it('has a stable reference sequence and supports seed zero', () => {
    const r = new SeededRandom(1);
    expect(Array.from({ length: 3 }, () => r.next())).toEqual([
      0.6270739405881613, 0.002735721180215478, 0.5274470399599522,
    ]);
    expect(new SeededRandom(0).next()).toBe(new SeededRandom(0).next());
  });
  it('rejects seeds that would silently alias', () => {
    for (const seed of [-1, 0.5, NaN, Infinity, 2 ** 32])
      expect(() => new SeededRandom(seed)).toThrow();
  });
});
