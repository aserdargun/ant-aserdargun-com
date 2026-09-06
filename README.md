# ANT — Ant Colony Intelligence Laboratory

A local-first, reproducible laboratory for seeing collective behavior emerge from simple local rules. This V0.1 implements **EXP-001: The first trail** as a complete first vertical slice, with actual pheromone dynamics rather than authored paths.

## Run locally

Requires Node.js 22.12+ and npm. No API keys, accounts or backend.

```bash
npm ci
npm run dev
```

Open [localhost:4187](http://127.0.0.1:4187). Stop the foreground server with **Ctrl+C**. The port is strict: an occupied port fails instead of silently serving a different checkout. A normal first visit starts at tick zero; reduced-motion users start paused and can run or step explicitly.

```bash
npm run validate       # lint, 15 headless tests, strict UI + no-DOM kernel type checks, build, format
npx playwright install chromium
npm run test:e2e       # production behavior plus development/production crash regressions
npm run evidence       # fixed-seed signaling ablation and headless performance measurements
npm run preview        # serve the built dist/ at port 4187
```

The browser suite starts and stops its own production preview on port 4188 and development server on port 4189. It checks interactions, accessibility, mobile, replay, timing-record memory and stalled-consumer frame delivery. Stop the development server before running the separate `preview` command on 4187. Evidence output is written to ignored `.local/evidence.json`; the reviewed baseline is in [docs/validation-evidence.json](docs/validation-evidence.json).

## The first experiment

Observe the 100-ant colony, then select food/home/combined chemical layers. Pause and step an individual tick, inspect an ant by clicking or using the accessible selector, and follow its local decisions. Change population, food-signal evaporation or exploration with **Apply & restart**. Keep the seed unchanged to investigate a parameter change. **Run & record** provides exact tick budgets and JSON export/import. Import recomputes the entire run from its inputs; it does not trust supplied metrics.

English and Turkish interfaces are included. Fonts are bundled locally with their licenses. Simulation state lives in a Web Worker; React owns application controls, while a separate Canvas adapter draws snapshots. The pure TypeScript kernel also runs under Node.

## Scientific contract

- Seeded Mulberry32, stable step ordering and versioned portable math.
- Separate home/food fields with deposition, no-flux diffusion, evaporation and local sampling.
- Ants know nearby probes/targets and their own integrated home vector; they receive no route or global map.
- **Home chemical is observational in V0.1.** Returning ants use idealized path integration; food chemical influences searching ants.
- Model ticks, distance and chemical units are not calibrated to a species. Results illustrate this model, not a universal biological law.
- Same-version replay, headless/browser equality, food conservation and emergent corridors are protected by tests. See the exact verified scope in [VALIDATION](docs/VALIDATION.md).

## Architecture and next milestones

[Assessment](docs/ASSESSMENT.md) · [Product](docs/PRODUCT.md) · [Architecture](docs/ARCHITECTURE.md) · [Simulation equations](docs/SIMULATION.md) · [Experiments](docs/EXPERIMENTS.md) · [Metric definitions](docs/METRICS.md) · [Research](docs/RESEARCH.md)

This slice covers the foundation, living colony, chemical behavior and a usable visual instrument. EXP-002–010, synchronized A/B comparison, richer guided interpretation and sandbox editing are subsequent milestones. ANT remains independently runnable; the SWI relationship is a conceptual link, not an implementation dependency.

## Publication

Source repository: [aserdargun/ant-aserdargun-com](https://github.com/aserdargun/ant-aserdargun-com).

The static `dist/` artifact targets Azure Static Web Apps Free in West Europe, in `aserdargun subscription 2`, using `rg-ant-aserdargun-com` and `swa-ant-aserdargun-com`. Each build validates its entry assets and Worker, then generates `release.json` with the source commit and SHA-256 asset manifest. GitHub publication precedes Azure provisioning.

After deployment, verify the generated HTTPS hostname with `npm run verify:live -- <url>` and run the production browser suite with `PLAYWRIGHT_BASE_URL=<url> npm run test:e2e`. The live suite does not start local servers. Custom-domain binding is a separate publication step.
