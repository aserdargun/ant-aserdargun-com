# V0.1 validation record

## Maintenance verification — 2026-09-10

- 17 headless tests passed. The original 6,000-tick scientific snapshot hash remains unchanged; simulation, brain and math versions are unchanged.
- Final lint, strict UI/kernel type checks, production build and formatting checks passed. `npm audit --json` reported zero known dependency vulnerabilities.
- `ANT_E2E_PORT=4288 npm run test:e2e`: 21 Chromium tests passed (19 production, two development). The alternate ports preserve other projects' listeners.
- Regression coverage includes invalid imports retaining selection/follow/drafts, exact Enter-submitted tick budgets, the run ceiling, startup and message-error recovery, custom-world identity, zero-deposition explanations, pinch/cancel, keyboard camera controls and camera reset at tick zero.
- All 26 term dialogs and three lessons were exercised in EN/TR. Layout widths 320, 390, 768, 1024 and 1536 passed overflow checks; automated WCAG A/AA scans passed for desktop, Turkish mobile and open term dialogs. Dedicated 6,000-tick desktop/mobile rendering checks had no console errors.
- Rendering now schedules frames only on changes. Imported parameter precision is preserved, Turkish numeric rendering follows the selected language, and paused finite runs report zero current ticks/s in the performance inspector.
- Local artifacts explicitly record `sourceDirty`; live verification requires a clean source tree. This maintenance pass was validated locally and has not been published.

The following sections preserve the original release evidence and its scientific limits.

Verified locally on 2026-09-06. This is the **first vertical slice**, not a declaration that the full ten-experiment V1 curriculum is complete.

## Completed checks

- `npm run validate`: ESLint, 15 headless tests across 7 files, strict application TypeScript, a separate ES2022-only/no-DOM kernel type check, production build and Prettier check.
- `npm run test:e2e`: 12 Playwright Chromium tests: 10 against the **production build and its real module Worker** on port 4188, plus two crash regressions against the development build on port 4189. The suite starts/stops both servers itself.
- `npm run evidence`: three fixed seeds, paired food-sensing ablation, 6,000 ticks each, and separate headless population measurements. The preserved machine-readable result is [validation-evidence.json](validation-evidence.json).
- Native desktop viewport 1536×1024 and mobile 390×844. EN/TR, pause/step/speed/reset, seed/new-seed, parameter changes, hypothesis retention, layers, selected-ant/follow/sensors/fit, run export/import and bad imports were exercised. A custom 240×180 imported world with 1,500 ants and out-of-slider-range values verifies numeric editing and automatic camera fitting against an actual rendered food pixel.
- Axe WCAG 2 A/AA and 2.1 AA automated scans: **zero violations** on desktop and Turkish mobile. This is automated coverage, not a complete accessibility certification. Mobile horizontal overflow: zero. Reduced-motion starts paused; an ordinary first visit starts a living colony from tick zero.
- Local preview on 4187 returns HTTP 200; its listener's working directory is this repository. Source is published at `aserdargun/ant-aserdargun-com`; cloud release identity is checked independently through `release.json` and the live verification commands below.

## Mandatory scientific contracts A–G

| Contract                    | Evidence                                                                                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A — exact repeatability     | Independent same-seed instances, different step batch sizes, reset replay, full-snapshot equality and a pinned SHA-256 baseline.                                                      |
| B — food loop               | Single-ant fixture discovers food and delivers it to the nest; conservation includes remaining, carried and delivered units.                                                          |
| C — returning deposition    | Food-signal mass becomes positive after pickup/return, with no prefilled food field.                                                                                                  |
| D — decay                   | Known mass 10 with evaporation 0.1 and diffusion disabled becomes 9; no-flux diffusion independently preserves mass within Float32 tolerance.                                         |
| E — local response          | Mirrored local food gradients produce mirrored turns; disabling sensing returns exploration; flat plateaus preserve heading.                                                          |
| F — unscripted trail        | The default and two additional fixed seeds form connected above-threshold chemical corridors and outperform the same-input food-sensing ablation. The renderer has no route geometry. |
| G — no rendering dependency | All scientific tests run in Node without a document. Kernel types compile without DOM or browser globals.                                                                             |

At **6,000 ticks**, with 100 ants and all settings held constant except food-signal sensing:

| Seed     | Delivered, sensing on | Delivered, sensing off | Connected corridor, on/off |
| -------- | --------------------: | ---------------------: | -------------------------- |
| 58392041 |                   919 |                    175 | yes / no                   |
| 7        |                   837 |                    170 | yes / no                   |
| 42       |                   927 |                    175 | yes / no                   |

For the default seed, the corridor threshold is 10 concentration units. Active cells occupy **13.875% of the complete grid** and contain **85.18% of food-signal concentration**. Four-neighbor connectivity is checked between neighborhoods of nest and food. The default first pickup occurs at tick **281**. These are model results at a declared horizon and threshold; connectivity is not a shortest-path proof, a universal stability claim, or biological validation. The sensing-off control still deposits chemical, but searching ants ignore it.

## Exact runtime/replay check

Browser verification initially exposed native transcendental rounding differences between Node and Chromium. The kernel now uses versioned fixed-operation numeric functions and bounded headings. The production Worker at tick 6,000 matches the Node **entire serialized snapshot**, including ants, chemical buffers, counters, history, visited cells, configuration and PRNG state. Its exported run also matches; importing that file recomputes the identical snapshot.

Pinned baseline, simulation `0.1.0`, brain `local-rule-1`, math `portable-math-1`, PRNG `mulberry32-1`, seed `58392041`, tick `6000`:

```text
64c9720504bb1f1ac97c3536f019d126cce54d85d11083bba9a7587395cc4e27
```

Node 22.23.1 and the installed Playwright Chromium were exercised. This is not evidence for every browser engine, arbitrary custom brain, or future model version. Any deliberate behavior change requires a version/baseline review before sharing incompatible run files.

## Performance observations

Headless measurements for 1,000 ticks, after 100 warmup ticks on this local Mac:

| Population |  Elapsed | Approximate achieved ticks/s |
| ---------- | -------: | ---------------------------: |
| 100        |   128 ms |                        7,814 |
| 1,000      |   527 ms |                        1,896 |
| 5,000      | 2,681 ms |                          373 |

These measurements exclude rendering, worker transfers and React. They do not promise those rates in the browser. A separate two-second Chromium sample at 1,000 ants and 1× recorded 87 animation callbacks over 2,038 ms (~43 callbacks/s), p95 frame interval 33.4 ms, one main-thread long task and no page errors. This is a short local responsiveness observation, **not a sustained 60 FPS guarantee**. Snapshot/UI sampling and rendering deserve profiling before claiming the 1,000/5,000-ant growth targets on other devices. Scientific state is never simplified to meet a rendering target.

### Intermittent white-screen crash regression

The development server on 4187 reproduced the reported failure at 1,000 ants and 100×: around 50 seconds, `performance.measure` threw `Data cannot be cloned, out of memory`, followed by React and Worker errors. Development timing entries for `WorldView` and `Inspectors` each contained approximately 3.9 MB of serialized props. Ordinary JS heap measurements did not include this retained timing payload. The earlier production-only browser suite did not exercise this development-specific failure.

Immutable snapshot accessors remove the large arrays from changed props without disabling React checks or browser timing APIs. A 60-second repeat of the same scenario reached the 100,000-tick cap with no page errors; all timing details together occupied approximately 2.6 MB of serialized JSON. Worker delivery now waits for frame acknowledgment, and Canvas/selector allocations are reused. The scientific kernel and pinned snapshot are unchanged.

The new browser regressions run against both builds. They require each retained timing detail to stay under 100 KB and the scenario's total under 10 MB, then exercise pause, exact step, reset and ant selection. A separate real Worker test withholds acknowledgment while a finite run completes, verifies a single retained frame, rejects invalid/stale acknowledgments, and confirms that eleven queued resets deliver the latest seed when consumption resumes.

The final implementation also completed two consecutive 100,000-tick runs in a 120-second development-browser check at 1,000 ants and 100×. No page errors or renderer crashes occurred. After garbage collection, used JS heap was approximately 17.6 MB; retained timing details totaled 5.3 MB, with the largest individual detail approximately 12 KB. Desktop and Turkish mobile interactions remained available, with zero horizontal overflow at 390 px. These are local Chromium observations, not a guarantee for every embedded browser or device.

## Visual comparison and retained evidence

The built-in browser connection was unavailable in this session; Playwright Chromium was used. Both the generated [concept](design/lab-concept.png) and latest [desktop rendering](design/rendered-desktop.png) were directly inspected with `view_image` in the same QA pass. The [Turkish mobile rendering](design/rendered-mobile-tr.png) was also inspected.

| Comparison point        | Result and intentional adaptation                                                                                                                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Composition             | ANT header, experiment title, three laboratory columns, living canvas, transport and interpretation strip retained. Desktop rails widened after first screenshot review.                                          |
| Palette                 | Paper/forest/ink, sage controls and amber food signal match the reference. Heatmap intensity is computed from fields.                                                                                             |
| Typography              | Serif headline/wordmark, sans-serif controls and monospaced data retained; fonts are self-hosted with licenses.                                                                                                   |
| Copy                    | Core title, no-leader introduction, three local rules and interpretation retained. Static concept measurements are replaced with actual values; startup interpretation reflects actual discovery/delivery status. |
| Scientific graphics     | Oriented ants and real fields, plus exact circular obstacle boundaries and a camera-correct scale; raster rocks, dust paths and decorative emblem are intentionally omitted.                                      |
| Controls and containers | Flat rails, thin borders and sage active states retained. Seed editing, 100×, run files, numeric import fallback and keyboard ant selector extend the concept for required functionality.                         |
| Responsive behavior     | World and transport precede secondary tools on mobile; EN/TR and controls remain usable with zero horizontal overflow. The document scrolls vertically to retain scientific notes and tools.                      |

Above-the-fold copy review found only the recorded functional additions: editable/new seed, 100× and run recording, observational-home disclosure, chemical legend, ant selector and detailed evidence disclosure. No fabricated metric or decorative claim remains. Fidelity is verified against the reference's visual system with the explicit scientific/responsive adaptations above; it is not a pixel-identical reproduction of static illustrative data.

## Resolved findings and remaining scope

Resolved: equal-probe left-turn bias; Node/Chromium numerical divergence; accessible slider names; lost hypothesis after parameter restart; misleading clamped controls for valid imports; stale camera position/follow state for imported worlds; export files exceeding the replay cap. Independent kernel and final interface reviews found no remaining actionable issue in the reviewed fixes.

Home chemical remains observational; returning navigation is idealized path integration. Recent events/history are bounded and are not a complete long-run event archive. Replay/export is capped at 100,000 ticks. Local hypothesis text is retained across parameter changes but is not stored inside the scientific run file. Synchronized A/B, the remaining curriculum, sandbox and calibrated species models remain subsequent work.

## Public release verification

Target: `swa-ant-aserdargun-com`, resource group `rg-ant-aserdargun-com`, Free, West Europe, `aserdargun subscription 2`. The generated production hostname is `ambitious-pebble-0ec95b303.3.azurestaticapps.net`. The deployment workflow validates the artifact before upload and checks the live commit, all 19 public asset hashes, JavaScript/CSS/font MIME types and missing-asset 404 behavior afterward.

```bash
npm run verify:live -- https://ambitious-pebble-0ec95b303.3.azurestaticapps.net
PLAYWRIGHT_BASE_URL=https://ambitious-pebble-0ec95b303.3.azurestaticapps.net npm run test:e2e
```

The live browser command runs the 10 production tests against Azure without starting local servers. Deployment completion additionally requires the Azure production environment to be `Ready` on `main`, a successful workflow for the current commit, matching local/remote/release SHAs, and a clean worktree. Custom-domain and DNS binding are outside this deployment.
