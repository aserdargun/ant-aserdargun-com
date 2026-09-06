# Architecture and replay

`src/simulation` owns domain state, PRNG, versioned portable math, geometry, fields and the local brain. `src/experiments` owns validated configuration, experiment metadata, replay envelopes and offline trail diagnostics. `src/worker` owns scheduling and commands, using the kernel's `tickCount` getter for tick budgets. React UI and Canvas rendering consume snapshots; neither participates in a scientific step.

The worker's `Runner` state machine supports reset, play/pause, speed, single step, finite run, import and export. Wall-clock scheduling lives separately in `entry.ts`. At 1×, play targets 60 fixed ticks per wall-clock second; 5×, 20× and 100× increase the number of identical steps. Movement, diffusion and evaporation never scale with frame duration. The scheduler bounds work in groups of at most four ticks, checks an approximately 10 ms budget, caps each callback at 120 ticks and caps accumulated scheduling credit at 240. These are responsiveness controls, not real-time guarantees.

Finite runs and replay execute as quickly as bounded batches allow, independently of the selected play speed. Snapshots are requested approximately every 32 ms while active and after commands. The transport permits one unacknowledged frame. React acknowledges its sequence after committing, on the next animation frame; until then the worker coalesces requests without allocating more snapshots. An acknowledgment publishes the latest pending state, including completed runs and resets. Sequence numbers survive resets so stale acknowledgments cannot release a newer frame. Background tabs with suspended animation frames retain one update while the worker can continue stepping.

Browser drawing is separate from stepping and snapshot publication. Slow hosts achieve fewer ticks per wall-clock second; no scientific ticks are skipped to match elapsed time. Worker timing measurements describe host performance and are not simulation state.

React components receive an immutable snapshot accessor instead of nested field arrays as props. React 19.2 development Performance Tracks otherwise expand those props into multi-megabyte timing records on every render, retaining them outside the ordinary JavaScript heap. The accessor captures one frame, preserving render consistency without disabling profiling or clearing browser diagnostics. Canvas heatmap buffers are reused until grid dimensions change; ant selector options are reused until population changes.

## Run files

Current envelope versions are defined centrally in `config.ts`:

| Component  | Version         |
| ---------- | --------------- |
| Schema     | 1               |
| Simulation | 0.1.0           |
| Brain      | local-rule-1    |
| World      | first-trail-1   |
| Experiment | EXP-001@1       |
| PRNG       | mulberry32-1    |
| Math       | portable-math-1 |

Export includes those versions, the full initial configuration including seed, tick count, metrics and bounded recent events. It is a replay recipe, not a resumable binary state dump. Import requires exact supported versions and validated config, resets to tick zero, and recomputes the requested number of steps. Imported metrics and event assertions are not trusted. Validation rebuilds a bounded config instead of retaining arbitrary imported objects.

The worker, export and import support at most 100,000 total ticks. The headless stepping API separately permits up to 1,000,000 ticks in one `stepMany` call; exporting a state beyond the replay cap throws instead of generating an unimportable run. Export through the browser pauses and cancels any queued finite run, capturing the actual completed tick count. A pause command also cancels the remaining finite-run/replay request; playing subsequently continues from the current state.

Snapshot arrays, ant state and configuration are copies. Snapshot PRNG state supports inspection; replay reconstructs from initial inputs. Algorithm changes that alter trajectories require an appropriate model version change before sharing incompatible run files. Current operational and verification evidence is recorded in [VALIDATION.md](VALIDATION.md).
