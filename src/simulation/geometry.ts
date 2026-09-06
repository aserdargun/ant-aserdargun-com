import type { Circle, Point, WorldConfig } from './types';
import { atan2, sin, cos, hypot } from './math';

export const ANT_RADIUS = 2;
export const distance = (a: Point, b: Point) => hypot(a.x - b.x, a.y - b.y);
export const bearing = (a: Point, b: Point) => atan2(b.y - a.y, b.x - a.x);
export const angleDifference = (a: number, b: number) => atan2(sin(a - b), cos(a - b));
export const turnToward = (heading: number, target: number, limit: number) =>
  heading + Math.max(-limit, Math.min(limit, angleDifference(target, heading)));

export function permitted(point: Point, world: WorldConfig, margin = ANT_RADIUS): boolean {
  return (
    point.x >= margin &&
    point.y >= margin &&
    point.x <= world.width - margin &&
    point.y <= world.height - margin &&
    world.obstacles.every((o) => distance(point, o) >= o.radius + margin)
  );
}

export function segmentHitsCircle(from: Point, to: Point, circle: Circle, margin = 0): boolean {
  const dx = to.x - from.x,
    dy = to.y - from.y;
  const length2 = dx * dx + dy * dy;
  const t =
    length2 === 0
      ? 0
      : Math.max(0, Math.min(1, ((circle.x - from.x) * dx + (circle.y - from.y) * dy) / length2));
  return hypot(from.x + t * dx - circle.x, from.y + t * dy - circle.y) < circle.radius + margin;
}

export function clearSegment(from: Point, to: Point, world: WorldConfig, margin = ANT_RADIUS) {
  return (
    permitted(to, world, margin) &&
    !world.obstacles.some((o) => segmentHitsCircle(from, to, o, margin))
  );
}
