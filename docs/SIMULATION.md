# Simulation contract

The kernel has no DOM, worker API, wall-clock input, or unseeded randomness. `Simulation` provides `reset`, `step`, `stepMany`, `snapshot`, `metrics`, and `exportRun`, with a read-only `tickCount` getter for scheduling without computing metrics. Model distances, ticks, food units and chemical values are abstract: none is calibrated to a species, seconds, millimeters or molarity.

## State and locality

Ants have continuous positions and headings, a searching/returning state, a one-unit carrying flag, accumulated travel distances and an integrated home vector. They do not collide with one another. Circular obstacles exclude a moving ant of radius 2; movement uses segment checks, not just destination checks.

The environment supplies three probes at heading offsets −0.55, 0 and +0.55 radians, each at the configured sensor distance. Blocked probes read zero chemical. A nearby food or nest bearing is detectable within its radius plus sensor distance, with a clear segment to its center. Food ties use configured source order. The brain receives these local observations, its own heading/state, its home-vector bearing and behavior parameters. It receives no global resource list, route, obstacle map, or other-ant positions.

Home displacement starts as the vector from the spawned position to nest center. Each successful displacement `Δp` updates `h ← h − Δp`; nest delivery recalibrates it to the center. This is idealized, effectively drift-free path integration, not learned navigation. The home field is deposited and sampled for observation, but its values never influence this brain's choices.

## Tick ordering

Increment the tick, then update ants in ascending stable ID order. For each ant:

1. Sense current fields and nearby targets, then choose a heading.
2. Attempt one configured-speed displacement; update integrated displacement and distances only if movement succeeds. Otherwise rotate by `0.55π`.
3. Record the occupied grid cell and increment dwell time.
4. Deposit according to the state on entry to this step's contact handling, then resolve pickup or delivery. Contact reverses heading and resets distance since source. Delivery also resets trip distance. Finally normalize heading into [−π, π).

After all ants, update both chemical fields, expire delivery timestamps outside the trailing window, and sample history every 30 ticks. Deposits are immediate: later ants can sense earlier ants' deposits in the same tick. Only each field's diffusion/evaporation pass is simultaneous. Stable update order is a modeling assumption.

## Decisions

Each decision consumes exactly two PRNG draws: noise uniform on `[-1,1)` and a choice uniform on `[0,1)`. No available probe causes a seeded avoidance rotation. A detectable target takes priority and turns toward its bearing by at most 0.4 radians.

Returning ants choose the available probe nearest their integrated home bearing, turn at most 0.24 radians and add noise scaled by 0.035. Searching ants choose the strongest available food reading, preserving forward direction when it is within 3% of that maximum. Above `reading × signalGain > 0.025`, they follow unless the choice draw is below `0.12 × exploration`; signal turning is bounded by 0.22 radians with noise scaled by `0.2 × exploration`. Otherwise they avoid a blocked forward probe or explore with noise scaled by `0.04 + 0.65 × exploration`. Thus exploration zero still has a small wandering component outside signal following.

## Chemical update

Fields use independent Float32 buffers on a square grid. A searching ant deposits home chemical `q_home exp(−d/400)`; a returning ant deposits food chemical `q_food exp(−d/650)`. Here `d` is actual travel since the last source transition, not straight-line distance. Deposits occur even on a blocked movement tick. A pickup tick deposits home chemical; a delivery tick deposits food chemical. Deposits in blocked cells are ignored, and each cell is capped at its configured maximum.

For concentration `C_i` after all deposits, diffusion coefficient `D` and evaporation fraction `e`, the next value is:

```text
C_i' = (C_i + D × (sum of four neighbor values − 4 C_i)) × (1 − e)
```

An outer-boundary or blocked neighbor contributes `C_i`, implementing no flux. Obstacle masks classify cell centers; this coarse chemical geometry differs from continuous ant collision geometry. Validated `0 ≤ D ≤ 0.24` preserves a nonnegative convex stencil. Without evaporation, diffusion preserves summed concentration up to floating-point error; caps remove excess deposited material. Coefficients are per tick and per grid step, so changing cell size is not a physically calibrated refinement.

## Reproduction and limits

Mulberry32 uses unsigned 32-bit state, accepts seed zero, and advances state by `0x6d2b79f5` per draw. Initialization consumes heading and radius draws in ant-ID order, followed by two draws per ant per tick. The same config, versions, seed and tick count reproduce state in the same JavaScript runtime, independently of batch size.

`portable-math-1` makes kernel transcendental approximations part of the versioned model. Native Node/browser transcendental differences were observed to amplify into different trajectories during verification, motivating fixed-operation implementations in `math.ts`. Sine reduces the angle and evaluates ten Taylor terms; cosine uses shifted sine. Atan2 applies quadrant logic to a range-reduced twenty-term arctangent series. Exponential reduces by ln(2), evaluates twenty terms and scales by a power of two. Two-dimensional distance uses `sqrt(x² + y²)`. Geometry, movement, integrated-bearing decisions and deposition use these helpers; renderer math is presentation-only.

The numeric test compares sampled sine/cosine angles from −50 to 50, exponential arguments from −50 to 0, and sampled finite atan2 pairs against native references with an absolute-error threshold of 1e−12. This is a bounded test, not a uniform error proof. Headings are normalized into [−π, π) at initialization and the end of each ant step, keeping the angular inputs within the tested range. The helpers serve finite model inputs, not a general-purpose IEEE special-value math API. The intent is reproducible cross-runtime trajectories; actual browser/headless equality checks and their scope belong in [VALIDATION.md](VALIDATION.md), rather than being assumed from approximation accuracy alone.

Reset begins with zero fields and fresh counters. Snapshots copy arrays and nested mutable state. The default brain is stateless; a substituted stateful brain would need its own reset/version contract. See [ARCHITECTURE.md](ARCHITECTURE.md) for replay boundaries and [VALIDATION.md](VALIDATION.md) for exercised contracts.
