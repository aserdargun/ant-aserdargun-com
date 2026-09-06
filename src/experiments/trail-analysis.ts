import type { SimulationSnapshot } from '../simulation/types';

/** Offline diagnostic. Never consulted by an ant, the brain, or the simulation. */
export function analyzeTrail(snapshot: SimulationSnapshot, threshold = 10) {
  const { columns, rows, food } = snapshot.fields;
  const { nest, foods, cellSize } = snapshot.config.world;
  const visited = new Uint8Array(food.length);
  const queue: number[] = [];
  let total = 0,
    concentrated = 0,
    activeCells = 0;
  for (let i = 0; i < food.length; i++) {
    total += food[i];
    if (food[i] >= threshold) {
      activeCells++;
      concentrated += food[i];
      const x = ((i % columns) + 0.5) * cellSize,
        y = (Math.floor(i / columns) + 0.5) * cellSize;
      if (Math.hypot(x - nest.x, y - nest.y) <= nest.radius + cellSize * 2) {
        queue.push(i);
        visited[i] = 1;
      }
    }
  }
  let connectedToFood = false;
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head],
      x = i % columns,
      y = Math.floor(i / columns);
    if (
      foods.some(
        (f) =>
          Math.hypot((x + 0.5) * cellSize - f.x, (y + 0.5) * cellSize - f.y) <=
          f.radius + cellSize * 2,
      )
    )
      connectedToFood = true;
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      const nx = x + dx,
        ny = y + dy,
        n = ny * columns + nx;
      if (nx >= 0 && ny >= 0 && nx < columns && ny < rows && !visited[n] && food[n] >= threshold) {
        visited[n] = 1;
        queue.push(n);
      }
    }
  }
  return {
    threshold,
    connectedToFood,
    activeCells,
    activeAreaFraction: activeCells / food.length,
    massFractionInActiveCells: total ? concentrated / total : 0,
    connectedCells: queue.length,
  };
}
