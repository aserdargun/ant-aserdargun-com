# ANT first vertical slice implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. The user's brief authorizes assessment followed by implementation in this session.

**Goal:** Produce a deterministic, headless-capable colony whose real chemical trail is observable in a usable browser laboratory.

**Architecture:** Pure TypeScript simulation owned by a Web Worker. Canvas adapter consumes snapshots; React handles controls and inspectors only.

**Tech Stack:** Node 22, npm, React, Vite, strict TypeScript, Vitest, ESLint, Prettier and Playwright.

**Spec:** `docs/ASSESSMENT.md`, supplied ANT master brief sections 52–55.

## Global constraints

- No uncontrolled randomness, React/DOM dependencies or wall-clock time in the kernel.
- Same versions + full config + seed + ticks reproduce the same run.
- No authored routes, global food knowledge, LLMs, backend or fabricated metrics.
- Establish chemical behavior before expanding the learning UI.
- All writes remain local; no commit/push/deploy in this first slice.

## Task 1: Headless scientific kernel

Files: `src/simulation/{types,prng,geometry,field,brain,simulation}.ts`, `src/experiments/config.ts`, `tests/{prng,field,simulation}.test.ts`, package/config files.

Interfaces: `SeededRandom.next(): number`; `ChemicalField.sample(x,y): number`; `AntBrain.decide(observation, random): Action`; `Simulation.reset(config): void`, `step(): void`, `stepMany(ticks): void`, `snapshot(): SimulationSnapshot`, `metrics(): Metrics`.

- [x] Add explicit types and config range/geometry checks before constructing arrays.
- [x] Write tests: `expect(new Simulation(c).stepMany(1800)).toEqual(...)` via snapshots of two independently stepped instances; compare PRNG reference sequence and seed zero.
- [x] Verify tests expose missing behavior; implement local probes and path integration, swept movement, pickup/delivery, independently configured fields and simultaneous no-flux diffusion.
- [x] Add conservation tests: `remaining + carrying + delivered === initialFood`; decay fixture `nextMass ≈ previousMass * (1 - evaporation)`; assert every ant remains outside obstacles at every checked tick.
- [x] Run `npm test`; record food-sensing-disabled ablation and a connected chemical corridor at a fixed seed/tick in `scripts/evidence.ts`.

## Task 2: Experiment and worker boundary

Files: `src/experiments/{catalog,run}.ts`, `src/worker/{protocol,runner,client}.ts`, `tests/{run,runner}.test.ts`.

Interfaces: `exportRun(): RunRecord`; `parseRun(unknown): RunRecord`; `WorkerCommand` discriminated union; `WorkerUpdate` carries snapshot, running state and scheduler-only timing.

- [x] Reject nonfinite numeric inputs, unknown versions, invalid geometry and excessive import tick counts.
- [x] Verify `replay(parseRun(JSON.parse(JSON.stringify(run))))` yields the original snapshot at the same tick.
- [x] Implement reset, play/pause, speed, single step and finite run; finite runs yield in bounded chunks and report actual achieved ticks.
- [x] Test command sequences without React and ensure reset cancels pending finite-run work.

## Task 3: Browser laboratory

Files: `src/rendering/{canvas,camera}.ts`, `src/ui/{App,WorldView,Controls,Parameters,Inspectors,Methodology,i18n}.tsx`, `src/ui/styles.css`, entry files.

Interfaces: renderer consumes `SimulationSnapshot` and camera/layer options, emits selection IDs; controls send typed worker commands; UI holds no mutable kernel state.

- [x] Extract design tokens, typography and layout from `docs/design/lab-concept.png`; retain the dark living canvas and paper side rails.
- [x] Render oriented ants, food/nest/obstacles and actual chemical arrays; provide labeled layers and text metrics.
- [x] Connect auto-start (except reduced motion), pause/step/speed/reset, editable seed/new seed, parameter apply/restart, selection and camera fit/zoom/pan.
- [x] Add explicit model interpretation, research links, export/import and concise accessible EN/TR copy. Keep long-run controls in a disclosure.
- [x] Run browser workflows at 1536×1024 and 390×844; inspect native screenshots and correct overflow, focus, control labels and rendering defects.

## Task 4: Evidence and handoff

Files: `docs/{PRODUCT,SIMULATION,EXPERIMENTS,ARCHITECTURE,METRICS,RESEARCH,VALIDATION}.md`, `README.md`, lifecycle scripts, CI workflow.

- [x] Run `npm run validate`, headless evidence and browser integration suite.
- [x] Record actual outputs, scientific assumptions, performance limitations, visual comparison and outstanding milestones.
- [x] Verify local preview responds and can be stopped without touching unrelated processes; inspect final Git state.
