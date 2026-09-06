import { expect, it } from 'vitest';
import { sin, cos, atan2, exp } from '../src/simulation/math';

it('portable model math stays close to independent native reference values', () => {
  for (let i = -500; i <= 500; i++) {
    const a = i / 10;
    expect(Math.abs(sin(a) - Math.sin(a))).toBeLessThan(1e-12);
    expect(Math.abs(cos(a) - Math.cos(a))).toBeLessThan(1e-12);
    expect(Math.abs(atan2(i, 113 - i) - Math.atan2(i, 113 - i))).toBeLessThan(1e-12);
    expect(Math.abs(exp(-Math.abs(a)) - Math.exp(-Math.abs(a)))).toBeLessThan(1e-12);
  }
  expect(atan2(0, 0)).toBe(0);
});
