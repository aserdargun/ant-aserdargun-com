/** portable-math-1: fixed operation order instead of engine-specific transcendental intrinsics.
 * These approximations are model behavior, not renderer helpers. Max tested error < 1e-12
 * for sin/cos/atan2 in their working ranges; exp uses range reduction and a fixed series.
 */
const PI = 3.141592653589793;
const HALF_PI = PI / 2;
const TWO_PI = PI * 2;
const LN2 = 0.6931471805599453;
export const wrapAngle = (angle: number): number =>
  angle - Math.floor((angle + PI) / TWO_PI) * TWO_PI;

export function sin(angle: number): number {
  let x = wrapAngle(angle);
  if (x > HALF_PI) x = PI - x;
  else if (x < -HALF_PI) x = -PI - x;
  const xx = x * x;
  let term = x,
    sum = x;
  for (let n = 1; n <= 9; n++) {
    term *= -xx / (2 * n * (2 * n + 1));
    sum += term;
  }
  return sum;
}
export const cos = (angle: number): number => sin(angle + HALF_PI);

function atan(value: number): number {
  if (value > 1) return HALF_PI - atan(1 / value);
  const shifted = value > 0.41421356237309503;
  const x = shifted ? (value - 1) / (value + 1) : value;
  let term = x,
    sum = x;
  const xx = x * x;
  for (let n = 1; n <= 19; n++) {
    term *= -xx;
    sum += term / (2 * n + 1);
  }
  return (shifted ? PI / 4 : 0) + sum;
}

export function atan2(y: number, x: number): number {
  if (x === 0) return y === 0 ? 0 : y > 0 ? HALF_PI : -HALF_PI;
  const angle = atan(Math.abs(y / x));
  return x > 0 ? (y >= 0 ? angle : -angle) : y >= 0 ? PI - angle : angle - PI;
}

export function exp(value: number): number {
  const power = Math.floor(value / LN2);
  if (power < -1074) return 0;
  const x = value - power * LN2;
  let term = 1,
    sum = 1;
  for (let n = 1; n <= 19; n++) {
    term *= x / n;
    sum += term;
  }
  return sum * 2 ** power;
}
export const hypot = (x: number, y: number): number => Math.sqrt(x * x + y * y);
