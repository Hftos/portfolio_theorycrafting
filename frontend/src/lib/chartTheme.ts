// Colors shared by every chart, matched to the page palette in index.css.

export const theme = {
  series: '#6e1f2c', // burgundy: the one data color for single-series charts
  grid: '#ddd0b6', // hairline gridlines, one step off the paper
  axis: '#a8987c', // baseline / axis line
  textPrimary: '#241b15', // ink
  textSecondary: '#6b5b4b', // faded ink
  surface: '#f8f3e6', // paper
}

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