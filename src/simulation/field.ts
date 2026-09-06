import type { FieldParameters, WorldConfig } from './types';
import { permitted } from './geometry';

export class ChemicalField {
  readonly columns: number;
  readonly rows: number;
  readonly blocked: Uint8Array;
  values: Float32Array;
  private next: Float32Array;
  private readonly neighbors: Int32Array;

  constructor(
    readonly world: WorldConfig,
    readonly parameters: FieldParameters,
  ) {
    this.columns = world.width / world.cellSize;
    this.rows = world.height / world.cellSize;
    const count = this.columns * this.rows;
    this.values = new Float32Array(count);
    this.next = new Float32Array(count);
    this.blocked = new Uint8Array(count);
    this.neighbors = new Int32Array(count * 4);
    for (let y = 0; y < this.rows; y++)
      for (let x = 0; x < this.columns; x++) {
        this.blocked[y * this.columns + x] = permitted(
          { x: (x + 0.5) * world.cellSize, y: (y + 0.5) * world.cellSize },
          world,
          0,
        )
          ? 0
          : 1;
      }
    for (let y = 0; y < this.rows; y++)
      for (let x = 0; x < this.columns; x++) {
        const i = y * this.columns + x;
        [
          x > 0 ? i - 1 : i,
          x < this.columns - 1 ? i + 1 : i,
          y > 0 ? i - this.columns : i,
          y < this.rows - 1 ? i + this.columns : i,
        ].forEach((n, d) => {
          this.neighbors[i * 4 + d] = this.blocked[n] ? i : n;
        });
      }
  }

  index(x: number, y: number) {
    return (
      Math.max(0, Math.min(this.rows - 1, Math.floor(y / this.world.cellSize))) * this.columns +
      Math.max(0, Math.min(this.columns - 1, Math.floor(x / this.world.cellSize)))
    );
  }
  sample(x: number, y: number) {
    return this.values[this.index(x, y)];
  }
  deposit(x: number, y: number, amount: number) {
    const i = this.index(x, y);
    if (!this.blocked[i])
      this.values[i] = Math.min(this.parameters.maximum, this.values[i] + Math.max(0, amount));
  }
  update() {
    const { evaporation, diffusion } = this.parameters;
    const v = this.values,
      n = this.neighbors;
    for (let i = 0; i < v.length; i++) {
      if (this.blocked[i]) {
        this.next[i] = 0;
        continue;
      }
      const around = v[n[i * 4]] + v[n[i * 4 + 1]] + v[n[i * 4 + 2]] + v[n[i * 4 + 3]];
      this.next[i] = (v[i] + diffusion * (around - 4 * v[i])) * (1 - evaporation);
    }
    [this.values, this.next] = [this.next, this.values];
  }
  mass() {
    return this.values.reduce((sum, value) => sum + value, 0);
  }
}
