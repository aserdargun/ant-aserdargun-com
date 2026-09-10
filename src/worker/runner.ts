import { Simulation } from '../simulation/simulation';
import { defaultConfig } from '../experiments/config';
import { MAX_RUN_TICKS, parseRun } from '../experiments/run';
import type { RunnerStatus, WorkerCommand } from './protocol';

/** Command state machine is headlessly testable; wall-clock scheduling belongs to entry.ts. */
export class Runner {
  simulation = new Simulation(defaultConfig());
  status: RunnerStatus = { playing: false, speed: 1, remainingTicks: 0 };

  command(command: WorkerCommand) {
    switch (command.type) {
      case 'reset':
        this.simulation.reset(command.config);
        this.status = { playing: command.play, speed: this.status.speed, remainingTicks: 0 };
        break;
      case 'play':
        this.status.playing = command.playing && this.simulation.tickCount < MAX_RUN_TICKS;
        this.status.remainingTicks = 0;
        break;
      case 'speed':
        if (![1, 5, 20, 100].includes(command.speed)) throw new Error('Invalid speed.');
        this.status.speed = command.speed;
        break;
      case 'step':
        this.status.playing = false;
        this.status.remainingTicks = 0;
        if (this.simulation.tickCount < MAX_RUN_TICKS) this.simulation.step();
        break;
      case 'run': {
        const current = this.simulation.tickCount;
        if (
          !Number.isInteger(command.ticks) ||
          command.ticks < 1 ||
          current + command.ticks > MAX_RUN_TICKS
        )
          throw new Error(`Run limit: ${MAX_RUN_TICKS} total ticks. Reset to begin again.`);
        this.status.playing = false;
        this.status.remainingTicks = command.ticks;
        break;
      }
      case 'import': {
        const run = parseRun(command.data);
        this.simulation.reset(run.config);
        this.status = { ...this.status, playing: false, remainingTicks: run.tickCount };
        break;
      }
      case 'export':
        this.status.playing = false;
        this.status.remainingTicks = 0;
        return this.simulation.exportRun();
    }
    return null;
  }

  advance(budget: number) {
    const allowed = Math.min(budget, MAX_RUN_TICKS - this.simulation.tickCount);
    const ticks = Math.max(
      0,
      this.status.remainingTicks
        ? Math.min(allowed, this.status.remainingTicks)
        : this.status.playing
          ? allowed
          : 0,
    );
    this.simulation.stepMany(ticks);
    if (this.status.remainingTicks) this.status.remainingTicks -= ticks;
    if (allowed <= ticks && this.simulation.tickCount >= MAX_RUN_TICKS) this.status.playing = false;
    return ticks;
  }
}
