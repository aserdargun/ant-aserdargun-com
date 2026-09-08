# ANT working contract

- Build the deterministic ant-colony scientific laboratory, with pheromone trails, evaporation and stigmergy as the mechanism for emergent collective foraging.
- Keep simulation truth in `src/simulation`; no React, DOM, wall clock, or unseeded randomness there. The Web Worker owns scheduling and commands; React and the Canvas adapter consume snapshots, never step the kernel.
- An ant receives only three local probes (at −0.55, 0, +0.55 rad), a nearby food/nest bearing, its own integrated home vector, and behavior parameters. It has no global resource list, route, obstacle map, or other-ant positions. Colony metrics (delivered, throughput, coverage) are observer outputs, never decision inputs. In V0.1 the home chemical is observational — returning ants use idealized path integration.
- Behavior, experiment, world, simulation, metric, and export schema versions are explicit. Update affected versions when semantics change.
- Every replay exports versions, full config, tick count, metrics and events. Imported metrics and events are not trusted; the kernel recomputes the run from its inputs. Reject unsupported versions and tick counts outside the 0–100000 range.
- Keep Turkish and English controls and explanations equivalent. Label model assumptions and simulation units (ticks, distance, food and chemical values are abstract, not calibrated to a species).
- Verify `npm run validate` and review `git diff --check` before handoff.
- Local work only unless the user authorizes external publication. Preserve unrelated work and processes.
