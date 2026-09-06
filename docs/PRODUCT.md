# ANT: first vertical slice

ANT is a local educational laboratory for observing collective foraging from individual rules. EXP-001, “The first trail,” begins with an empty chemical field and ants at one nest. Ants explore, discover finite food, carry one unit home, and leave chemical deposits. A route is an outcome to investigate, not a line authored into the world.

The first slice combines a deterministic headless TypeScript simulation with a worker-driven, bilingual EN/TR browser laboratory. It supports transport controls, seeded restarts, parameter experiments, chemical layers, ant and colony inspection, and run export/replay through 100,000 ticks. Replay records include the numeric implementation version alongside the model and seed. The browser presentation reads simulation state; visual layers do not steer ants.

The learning task is to formulate a prediction, run a controlled change, inspect individual decisions and collective measurements, then qualify the result. More delivered food does not by itself demonstrate a trail. The offline corridor diagnostic and signal ablation support that distinction; see [EXPERIMENTS.md](EXPERIMENTS.md).

This slice has one colony and one exposed experiment. It does not implement the full ten-experiment curriculum, synchronized A/B comparison, evolved brains, multi-colony competition, or biological calibration. No persistent backend is required. Valid configuration ranges are input limits, not a performance guarantee for every population or grid size.

Returning navigation uses idealized displacement integration. Home chemical is visible and sampled but does not steer this brain. Food-signal reinforcement may form, weaken, branch, or collapse; a stable or optimal trail is not guaranteed. Read [SIMULATION.md](SIMULATION.md) for the actual rules, [RESEARCH.md](RESEARCH.md) for the biological context, and [VALIDATION.md](VALIDATION.md) for recorded verification rather than treating the initial assessment as a test report.
