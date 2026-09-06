export const firstTrail = {
  id: 'EXP-001',
  version: 1,
  slug: 'first-trail',
  title: { en: 'The first trail.', tr: 'İlk iz.' },
  learningGoal: 'Observe how local chemical feedback recruits foragers without a planned route.',
  hypothesisPrompt: 'What changes when the colony forgets faster?',
  controlledVariables: ['seed', 'world geometry', 'brain version', 'tick count'],
  independentVariables: ['population', 'food evaporation', 'exploration'],
  metrics: [
    'delivered',
    'returning',
    'coverage',
    'firstDiscoveryTick',
    'throughput',
    'meanTripDistance',
  ],
  concepts: [
    'emergence',
    'stigmergy',
    'decentralization',
    'positive feedback',
    'negative feedback',
    'exploration',
  ],
  interpretation:
    'In this model, returning ants deposit a local signal. Searching ants can follow it and reinforce a shared transport corridor. A persistent route is not guaranteed for every seed or parameter setting.',
  references: ['https://doi.org/10.1007/BF01417909', 'https://doi.org/10.1007/BF00462870'],
} as const;
