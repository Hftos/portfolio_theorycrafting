// Colors and styles shared by every chart, so they all look like one system.

export const theme = {
  series: '#2a78d6', // the one data color for single-series charts
  grid: '#e1e0d9', // hairline gridlines: recessive, one step off the surface
  axis: '#c3c2b7', // baseline / axis line
  textPrimary: '#0b0b0b',
  textSecondary: '#52514e',
  surface: '#ffffff',
}

// Diverging scale for correlations: red (-1) -> gray (0) -> blue (+1).
const NEGATIVE = [227, 73, 72] // #e34948
const NEUTRAL = [240, 239, 236] // #f0efec
const POSITIVE = [42, 120, 214] // #2a78d6

export function correlationColor(value: number | null): string {
  if (value === null) return `rgb(${NEUTRAL.join(',')})`
  const t = Math.min(1, Math.abs(value))
  const end = value < 0 ? NEGATIVE : POSITIVE
  const rgb = NEUTRAL.map((n, i) => Math.round(n + (end[i] - n) * t))
  return `rgb(${rgb.join(',')})`
}

// Axis tick text styling for Recharts
export const tickStyle = { fill: theme.textSecondary, fontSize: 12 }