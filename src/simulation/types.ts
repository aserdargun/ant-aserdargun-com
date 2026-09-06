export interface Point {
  x: number;
  y: number;
}
export interface Circle extends Point {
  radius: number;
}
export interface Nest extends Circle {
  colonyId: number;
}
export interface FoodSource extends Circle {
  id: number;
  amount: number;
}
export interface Obstacle extends Circle {
  id: number;
}
export interface FieldParameters {
  deposit: number;
  evaporation: number;
  diffusion: number;
  maximum: number;
}
export interface WorldConfig {
  width: number;
  height: number;
  cellSize: number;
  nest: Nest;
  foods: FoodSource[];
  obstacles: Obstacle[];
}
export interface SimulationConfig {
  seed: number;
  population: number;
  world: WorldConfig;
  brain: { exploration: number; sensorDistance: number; speed: number; signalGain: number };
  fields: { home: FieldParameters; food: FieldParameters };
}
export type AntState = 'searching' | 'returning';
export interface Probe {
  angle: number;
  food: number;
  home: number;
  blocked: boolean;
}
export interface Observation {
  heading: number;
  state: AntState;
  probes: Probe[];
  targetBearing: number | null;
  homeBearing: number;
  exploration: number;
  signalGain: number;
}
export interface Action {
  heading: number;
  reason: 'explore' | 'signal' | 'food' | 'home' | 'avoid';
}
export interface Ant extends Point {
  id: number;
  colonyId: number;
  heading: number;
  state: AntState;
  carryingFood: boolean;
  tripDistance: number;
  distanceSinceSource: number;
  homeVector: Point;
  dwellTicks: number;
  sensors: Probe[];
  decision: Action['reason'];
}
export interface Colony {
  id: number;
  population: number;
  delivered: number;
}
export interface SimulationEvent {
  tick: number;
  type: 'discovery' | 'pickup' | 'delivery';
  antId: number;
}
export interface Metrics {
  tick: number;
  delivered: number;
  searching: number;
  returning: number;
  remaining: number;
  coverage: number;
  firstDiscoveryTick: number | null;
  meanTripDistance: number | null;
  throughput: number;
  foodSignalMass: number;
}
export interface MetricSample {
  tick: number;
  delivered: number;
}
export interface SimulationSnapshot {
  tick: number;
  randomState: number;
  config: SimulationConfig;
  colony: Colony;
  ants: Ant[];
  foods: FoodSource[];
  fields: { columns: number; rows: number; home: Float32Array; food: Float32Array };
  metrics: Metrics;
  history: MetricSample[];
  events: SimulationEvent[];
  visited: Uint8Array;
  totalTripDistance: number;
  deliveryTicks: number[];
}
