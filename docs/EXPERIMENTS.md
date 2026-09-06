# EXP-001: The first trail

The learning goal is to observe how local chemical feedback can recruit foragers without a planned route. The prompt is: “What changes when the colony forgets faster?” Food evaporation provides negative feedback; deposition and recruitment provide positive feedback; exploration creates opportunities for discovery.

Start from tick zero. Record a seed, geometry, brain/math versions and observation horizon, then change one of population, food evaporation or exploration while retaining the other settings. Restart to apply the changed configuration. Export each outcome with its inputs within the 100,000-tick replay cap. Repeat across seeds before generalizing. The interface exposes one experiment; paired runs are a manual procedure, not a synchronized A/B feature.

## What constitutes evidence

Inspect deliveries, first discovery, current foraging states and route structure together. Delivery is possible without chemical sensing because ants explore and return through path integration. For a causal signal ablation, set `brain.signalGain = 0` while keeping deposit, motion, world, seed and horizon unchanged. The two draws per decision preserve comparable PRNG indexing; trajectories and resource contacts still diverge after decisions change.

`analyzeTrail` is an offline diagnostic, never an input to an ant. It thresholds food chemical (default 10) and flood-fills four-neighbor active cells starting within `nest.radius + 2 × cellSize`. Connectivity succeeds when that component reaches within `food.radius + 2 × cellSize` of any configured source. It reports active area fraction, concentrated mass fraction, connected cells and connectivity. See [METRICS.md](METRICS.md) for denominators and limitations.

A connected field at one instant supports a corridor observation at that threshold. It does not prove stable ant traffic, optimal routing, directionality, or persistence. A depleted source still counts as a configured endpoint. Use multiple observation times, traffic/delivery context and ablation; retain failures and episodic collapse instead of selecting only attractive frames. A scalar summary should not be presented as a biological result.

The first slice uses the hypotheses and scientific contracts described here; measured outcomes, exact commands and the completed validation status belong in [VALIDATION.md](VALIDATION.md). Future experiments and broader biological claims require their own implementations and evidence.
