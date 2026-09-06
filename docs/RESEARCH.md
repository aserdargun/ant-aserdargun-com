# Research context and model boundaries

The following primary publications motivate questions about collective organization. Publisher metadata and the available abstract/preview were checked on 2026-09-06; subscription-only full text was not used to derive the implementation.

1. J.-L. Deneubourg, S. Aron, S. Goss and J. M. Pasteels (1990), [“The self-organizing exploratory pattern of the argentine ant”](https://link.springer.com/article/10.1007/BF01417909), _Journal of Insect Behavior_ 3, 159–168. The abstract describes exploratory recruitment in initially unmarked territory and a minimal model linking collective patterns to individual trail deposition and following. This motivates ANT's question about local rules and collective structure; ANT's finite food-target task differs from the paper's destination-free exploratory trails.

2. S. Goss, S. Aron, J. L. Deneubourg and J. M. Pasteels (1989), [“Self-organized shortcuts in the Argentine ant”](https://link.springer.com/article/10.1007/BF00462870), _Naturwissenschaften_ 76, 579–581. The verified publisher preview establishes the publication and its shortcut topic. It is contextual reading for route organization, not evidence that ANT discovers shortest paths; no detailed experimental protocol or quantitative result is inferred from this preview.

## What ANT assumes

ANT's three directional probes, deterministic seeded noise, versioned numeric approximations, threshold and turn constants, exponential deposits, two Float32 grid fields, circular obstacles and idealized home displacement are educational engineering choices. The home field is observational; returning ants use path integration rather than home chemical. The cited papers do not validate these precise equations, coefficients, navigation rules, units or software outputs.

The model demonstrates mechanisms and supports controlled in-model comparisons. It is not a species reconstruction, a fitted biological prediction, or a reproduction of either paper's full experiment. A visible chemical corridor is an emergent simulation observation, and its interpretation needs the thresholds, ablations and limitations in [EXPERIMENTS.md](EXPERIMENTS.md). Actual checks and evidence are tracked separately in [VALIDATION.md](VALIDATION.md).
