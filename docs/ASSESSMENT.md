# ANT V0.1 architectural assessment

Date: 2026-09-06. Scope: the first vertical slice in sections 52–55 of the supplied product brief.

## 1. Current state

The workspace is an empty initialized Git repository, on unborn `master`, without a remote, commits, files, dependencies, or inherited AGENTS.md. Node 22.23.1 and npm 10.9.8 are available. No existing conventions or user changes require migration. Implementation is authorized by the supplied brief; publishing is outside this local slice.

## 2. Directory architecture

```text
src/
  simulation/   domain, PRNG, geometry, fields, local brain, kernel, metrics
  experiments/  validated configuration, EXP-001, versioned run format
  worker/       command protocol, bounded scheduler, client store
  rendering/    Canvas 2D adapter, camera, field visualization
  ui/           React composition, controls, inspectors, localized copy
tests/          headless scientific contracts and integration tests
e2e/            real browser user workflows
scripts/        reproducible evidence/benchmark commands
docs/           product, model, architecture, experiments, metrics, research
```

## 3. Simulation architecture

Pure TypeScript exposes `reset(config)`, `step()`, `stepMany(ticks)`, `snapshot()`, `metrics()`, `exportRun()`. No React, DOM, worker API, wall-clock time, or unseeded randomness enters the kernel. One tick has a fixed rule ordering: local observations and decisions in stable ant-ID order, movement and contact, deposition, then simultaneous field diffusion and evaporation. Ants do not collide with one another in this abstraction. Run metadata is separate from deterministic scientific state.

A worker owns the kernel and communicates immutable snapshots. UI controls change run configuration only by an explicit restart. Speed changes execute more identical ticks; they never scale movement or chemical coefficients. Large finite runs yield in small batches so pause/reset remain responsive.

## 4. Domain model

World has dimensions in model distance units, a grid cell size, one nest, food sources, and circular obstacles. Colony has ID, population and delivered inventory. Ant has stable ID, position, heading, state, carrying flag, trip distance, local sensors, and an integrated displacement from home. ChemicalField has concentration buffers, obstacle mask and independent deposit/diffusion/evaporation/cap parameters. Experiment defines learning goal, hypothesis, controlled and independent variables, model configuration, metrics and interpretation. Events record first discovery, pickup and delivery in bounded recent history while counters retain full totals.

The brain consumes only three nearby directional field/obstacle probes, nearby food/nest contact bearings, its current heading and its own integrated home vector. It receives no world, list of resources, map, route, or other ants. Path integration is an explicit educational simplification, not a claim of identical navigation across ant species.

## 5. Deterministic PRNG

Use a versioned Mulberry32 unsigned-32-bit PRNG; seed zero is valid. Initialization and decision noise consume this stream in documented stable order. PRNG state belongs in snapshots. Browser cryptographic entropy may choose a new seed outside the kernel, after which all behavior is seeded. Same versions, world, brain, parameters, seed and tick count must reproduce exact state within the same JS runtime. Cross-engine bitwise identity of transcendental math is not promised; browser/headless fixture checks will test the available runtimes.

## 6. Rendering strategy

React + Vite, rather than a server framework: the first slice is entirely local, static-hostable, and has no server data requirements. Canvas 2D provides a small, auditable first renderer for 100–1,000 ants. High-DPI backing store, independent animation cadence, labeled chemical raster, oriented ant glyphs and coordinate-aware selection. Canvas imagery always derives from world state; generated design imagery is never used as simulation output. Camera and sampling are presentation-only. Benchmark before moving to PixiJS/WebGL or packed snapshots.

## 7. Experiment architecture

Only EXP-001 is exposed as complete. Validated run envelope contains schema, simulation, brain, world and experiment versions, complete initial config, seed, tick count, metrics and recorded events. Import replays from tick zero, rather than trusting arbitrary state. Export/import round-trip and bad-version failures are tested. EXP-002–010 and synchronized A/B are later milestones, not empty routes or disabled promises.

## 8. Testing strategy

Vitest in Node proves A–G from the brief: exact seeded repeatability; pickup → return → inventory; returning deposition; decay; brain response to local gradients; quantitative emergent corridor with no authored route and a food-sensing-disabled ablation; independent headless execution. Additional tests cover no-flux diffusion mass balance, obstacles/bounds, finite nonnegative concentrations, food conservation, snapshot isolation, schema failures and replay equivalence. Browser checks exercise actual worker execution, pause/step/reset, parameter restart, field layers, selection, export, desktop/mobile and reduced motion. TypeScript strict builds and lint complete the engineering gate.

## 9. Implementation plan

1. Define domain, configuration and seeded PRNG with tests.
2. Implement fields, sensing, movement, contact and metrics; tune only against explicit scientific checks, then lock behavior with fixtures.
3. Capture an independently reproducible evidence report and ablation before expanding UI.
4. Implement worker scheduling and a restrained laboratory using the generated full-screen reference; include EN/TR, transport, seed, layers, parameters, ant/colony inspectors and methodology.
5. Verify in browser, document equations/limits and produce a local runnable handoff.

## 10. Risks and unknowns

- Reinforcement can lock into loops; a decreasing deposit with distance since food, evaporation and exploration need measured defaults.
- Home path integration makes returning easier; its contribution must be distinguished from environmental information.
- Food delivery alone does not establish a trail. Measure spatial concentration/connectivity and compare signal-disabled runs.
- Sequential ant updates introduce a stable ID ordering assumption; no biological simultaneity is claimed.
- Model units are not calibrated to seconds, millimeters, chemical molarity or a species.
- Canvas performance and snapshot transfer overhead require measurements. 5,000 agents is a future benchmark target, not an initial performance promise.
- Visible discovery time varies by seed. Never preload a fabricated trail or warm up invisibly.
- Diffusion uses a coarse lattice and no-flux boundaries, not continuous chemical physics.
- The first slice is not the full ten-experiment V1 curriculum or validated biological research software.

## Completion record

The first slice was implemented and verified. See [VALIDATION.md](VALIDATION.md) for completed checks, measured evidence, portable-math changes, visual adaptations and the remaining V1 milestones.
