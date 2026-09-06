import type { WorkerRequest, WorkerUpdate } from './protocol';

export class SimulationClient {
  private worker: Worker;
  private listeners = new Set<(update: WorkerUpdate) => void>();
  constructor() {
    this.worker = new Worker(new URL('./entry.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (event: MessageEvent<WorkerUpdate>) =>
      this.listeners.forEach((fn) => fn(event.data));
    this.worker.onerror = () =>
      this.listeners.forEach((fn) =>
        fn({ type: 'error', message: 'The simulation worker could not run. Reload to retry.' }),
      );
  }
  send(command: WorkerRequest) {
    this.worker.postMessage(command);
  }
  subscribe(listener: (update: WorkerUpdate) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  dispose() {
    this.worker.terminate();
    this.listeners.clear();
  }
}
