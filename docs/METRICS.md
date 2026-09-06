# Metrics and interpretation

Metrics are deterministic model observations unless explicitly labeled worker performance. Chemical values and distances use model units. Trajectories and their metrics depend on the recorded math version as well as the PRNG, brain and configuration; agreement with native numeric references alone does not establish identical outcomes across runtimes. See [SIMULATION.md](SIMULATION.md) for the numeric contract.

| Metric               | Definition and limit                                                                                                                                                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tick`               | Number of completed fixed updates.                                                                                                                                                                                                                   |
| `delivered`          | Cumulative food units deposited at the nest. Each successful delivery adds one.                                                                                                                                                                      |
| `returning`          | Ants carrying one food unit now.                                                                                                                                                                                                                     |
| `searching`          | Population minus returning ants.                                                                                                                                                                                                                     |
| `remaining`          | Sum of current source inventories. Initial inventory equals remaining + returning + delivered.                                                                                                                                                       |
| `coverage`           | 100 × distinct unblocked grid cells occupied after movement / all unblocked grid cells. Counts point occupancy, not sensor visibility; initial positions are not counted until stepping.                                                             |
| `firstDiscoveryTick` | Tick of the first actual pickup, not first sensory detection; null before pickup.                                                                                                                                                                    |
| `meanTripDistance`   | Sum of travel distances for completed delivery trips / delivered units; null before delivery. Includes outward exploration and return, not just the food-to-nest leg. The first trip starts at each spawned position. Unfinished trips are excluded. |
| `throughput`         | Deliveries at ticks strictly greater than `tick − 1000`, divided by `min(1000, tick)`, multiplied by 1000. Zero at tick zero; units are food per 1,000 ticks, with a shorter startup window.                                                         |
| `foodSignalMass`     | Sum of food-field cell concentrations. This is a grid diagnostic, not calibrated chemical mass or a cell-area integral.                                                                                                                              |

The recent event list retains at most 256 discovery/pickup/delivery records; it is not a complete event log. Cumulative counters retain totals. Delivery history samples every 30 ticks and keeps at most 600 samples, so a long run's displayed history may no longer contain tick zero or the exact current tick.

## Offline trail diagnostic

`analyzeTrail(snapshot, threshold = 10)` defines active cells by `food ≥ threshold`. Active area fraction divides their count by all grid cells, including obstacle cells. Mass fraction divides concentration in active cells by total food concentration and returns zero for an empty field. `connectedCells` counts active cells reachable by four-neighbor adjacency from active cells near the nest; `connectedToFood` checks whether this component approaches any configured food source within two cell widths beyond its radius.

These outputs depend on threshold, grid resolution and endpoint tolerance. Connectivity says nothing about current food availability, traffic direction, shortest paths or long-term stability. Coverage and active area fraction use different denominators. Compare configurations with the same grid before interpreting changes as behavioral effects.

Worker ticks/second and batch milliseconds are wall-clock measurements of achieved execution, not biological time or deterministic outcome metrics. For measured results and limitations of the validation run, see [VALIDATION.md](VALIDATION.md).
