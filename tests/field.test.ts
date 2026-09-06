import { describe, expect, it } from 'vitest';
import { ChemicalField } from '../src/simulation/field';
import { defaultConfig } from '../src/experiments/config';

describe('chemical environment', () => {
  it('D: evaporates by the exact configured fraction', () => {
    const c = defaultConfig();
    const f = new ChemicalField(c.world, { ...c.fields.food, evaporation: 0.1, diffusion: 0 });
    f.deposit(100, 100, 10);
    f.update();
    expect(f.mass()).toBeCloseTo(9, 6);
  });
  it('diffusion redistributes mass without leakage at outer and obstacle boundaries', () => {
    const c = defaultConfig();
    const f = new ChemicalField(c.world, { ...c.fields.food, evaporation: 0, diffusion: 0.2 });
    f.deposit(1, 1, 10);
    f.deposit(425, 275, 10);
    for (let i = 0; i < 100; i++) f.update();
    expect(f.mass()).toBeCloseTo(20, 4);
    expect(f.sample(1, 1)).toBeLessThan(10);
    expect(f.values.every((v) => v >= 0 && Number.isFinite(v))).toBe(true);
    expect(f.sample(470, 275)).toBe(0);
  });
  it('caps deposits and never deposits inside an obstacle', () => {
    const c = defaultConfig(),
      f = new ChemicalField(c.world, c.fields.food);
    f.deposit(100, 100, 1000);
    f.deposit(470, 275, 10);
    expect(f.sample(100, 100)).toBe(100);
    expect(f.sample(470, 275)).toBe(0);
  });
});
