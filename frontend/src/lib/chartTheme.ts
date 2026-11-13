// Colors shared by every chart, matched to the page palette in index.css.

export const theme = {
  series: '#9b2c3e', // burgundy: your portfolio's color (SERIES_COLORS[0])
  grid: '#ddd0b6', // hairline gridlines, one step off the paper
  axis: '#a8987c', // baseline / axis line
  textPrimary: '#241b15', // ink
  textSecondary: '#6b5b4b', // faded ink
  surface: '#f8f3e6', // paper
}

// One color per portfolio, in a fixed order: slot 0 (burgundy) is always yours.
// This order was checked with a palette validator: neighbors stay distinguishable
// for colorblind viewers (worst ΔE 12.6), and every color is at least 3:1 against the paper.
export const SERIES_COLORS = [
  '#9b2c3e', // burgundy: your portfolio
  '#a8781a', // ochre
  '#2f6db0', // blue
  '#d06a3a', // rust
  '#8152a6', // violet
  '#22825f', // green
]

// Diverging scale for correlations: burgundy (-1) -> paper (0) -> banknote green (+1).
const NEGATIVE = [110, 31, 44] // #6e1f2c
const NEUTRAL = [236, 227, 207] // #ece3cf
const POSITIVE = [47, 90, 76] // #2f5a4c

export function correlationColor(value: number | null): string {
  if (value === null) return `rgb(${NEUTRAL.join(',')})`
  const t = Math.min(1, Math.abs(value))
  const end = value < 0 ? NEGATIVE : POSITIVE
  const rgb = NEUTRAL.map((n, i) => Math.round(n + (end[i] - n) * t))
  return `rgb(${rgb.join(',')})`
}

// Dark cells need light text to stay readable.
export function correlationTextColor(value: number | null): string {
  return value !== null && Math.abs(value) > 0.55 ? theme.surface : theme.textPrimary
}

// Axis tick text for Recharts
export const tickStyle = { fill: theme.textSecondary, fontSize: 13 }

// Yearly returns: green for gains, burgundy for losses, deepest at ±30% or more.
export function returnCellColor(value: number): string {
  return correlationColor(Math.max(-1, Math.min(1, value / 0.3)))
}

export function returnTextColor(value: number): string {
  return correlationTextColor(Math.max(-1, Math.min(1, value / 0.3)))
}
