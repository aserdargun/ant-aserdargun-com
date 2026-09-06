import type { Action, Observation } from './types';
import type { SeededRandom } from './prng';
import { angleDifference, turnToward } from './geometry';

export interface AntBrain {
  decide(observation: Observation, random: SeededRandom): Action;
}

/** Only local probes and an ant's own integrated home bearing cross this boundary. */
export class RuleBasedBrain implements AntBrain {
  decide(o: Observation, random: SeededRandom): Action {
    // Exactly two PRNG draws per decision, irrespective of branch, for useful ablations.
    const noise = random.next() * 2 - 1;
    const choice = random.next();
    const available = o.probes.filter((p) => !p.blocked);
    if (!available.length)
      return { heading: o.heading + Math.PI * (0.6 + choice * 0.8), reason: 'avoid' };
    if (o.targetBearing !== null)
      return {
        heading: turnToward(o.heading, o.targetBearing, 0.4),
        reason: o.state === 'searching' ? 'food' : 'home',
      };
    if (o.state === 'returning') {
      // Proprioceptive path integration, with local obstacle probes. No global nest coordinates.
      const best = available.reduce((a, b) =>
        Math.abs(angleDifference(b.angle, o.homeBearing)) <
        Math.abs(angleDifference(a.angle, o.homeBearing))
          ? b
          : a,
      );
      const heading = turnToward(o.heading, best.angle, 0.24);
      return { heading: heading + noise * 0.035, reason: best === o.probes[1] ? 'home' : 'avoid' };
    }
    const strongestProbe = available.reduce((a, b) => (b.food > a.food ? b : a));
    const forward = o.probes[1];
    // Near-equal readings preserve heading instead of imposing a left-turn tie bias.
    const best =
      !forward.blocked && strongestProbe.food <= forward.food * 1.03 ? forward : strongestProbe;
    const strongest = best.food * o.signalGain;
    if (strongest > 0.025 && choice >= o.exploration * 0.12) {
      return {
        heading: turnToward(o.heading, best.angle, 0.22) + noise * o.exploration * 0.2,
        reason: 'signal',
      };
    }
    if (o.probes[1].blocked)
      return {
        heading: turnToward(
          o.heading,
          available[Math.floor(choice * available.length)].angle,
          0.45,
        ),
        reason: 'avoid',
      };
    return { heading: o.heading + noise * (0.04 + o.exploration * 0.65), reason: 'explore' };
  }
}
