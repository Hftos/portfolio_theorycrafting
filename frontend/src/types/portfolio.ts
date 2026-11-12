// State for the portfolio builder (what the user is editing on the page).
// This is separate from types/api.ts, which is what gets sent to the backend.

import type { Rebalance } from './api'

export interface HoldingRow {
  id: number // stable ID so React can track rows as they're added and removed
  ticker: string
  weight: string // kept as text while typing; converted to a number on send
}

export interface Settings {
  rebalance: Rebalance
  startDate: string // "" means "earliest available"
  endDate: string // "" means "latest available"
  riskFreeRate: string // in percent, e.g. "2" for 2%
}

// A portfolio to compare yours against: either a preset or one you build.
export interface Comparison {
  id: number
  name: string
  colorSlot: number // fixed when added, so removing one never repaints the others
  presetId: string | null // null = custom
  description: string
  holdings: HoldingRow[]
}

// What the charts need to draw each portfolio: name and color, in request order.
export interface SeriesMeta {
  name: string
  color: string
}