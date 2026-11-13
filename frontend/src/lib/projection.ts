// Shared definitions for the projection views.

import type { ProjectionModel } from '../types/api'

// The five levels, from best to worst, with the percentile each one reads off.
export const LEVELS = [
  { key: 'p95', name: 'Exceptional', note: 'Only 1 in 20 simulated futures did better' },
  { key: 'p75', name: 'Strong', note: '1 in 4 did better' },
  { key: 'p50', name: 'Expected', note: 'The median: half did better, half worse' },
  { key: 'p25', name: 'Conservative', note: '1 in 4 did worse' },
  { key: 'p5', name: 'Poor', note: 'Only 1 in 20 did worse' },
] as const

// The two models, with a plain-English description of each.
export const MODELS: { value: ProjectionModel; label: string; description: string }[] = [
  {
    value: 'bootstrap',
    label: 'Historical',
    description:
      'Replays real market history in random order, a year at a time. Crashes stay as long and as deep as they really were.',
  },
  {
    value: 'normal',
    label: 'Bell curve',
    description:
      "Draws returns from a bell curve with history's average and volatility. Simpler, but it makes big crashes rarer than they really are.",
  },
]

// What to assume about future returns compared with history.
export const RETURN_ASSUMPTIONS = [
  { value: 0.01, label: '1% a year better than history' },
  { value: 0, label: 'Same as history' },
  { value: -0.01, label: '1% a year worse than history' },
  { value: -0.02, label: '2% a year worse than history' },
  { value: -0.03, label: '3% a year worse than history' },
]