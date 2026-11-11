// Display helpers. The backend sends raw decimals; these make them readable.

// 0.0747 -> "7.47%"
export function pct(value: number | null, digits = 2): string {
  if (value === null || Number.isNaN(value)) return '—'
  return `${(value * 100).toFixed(digits)}%`
}

// 52677.4 -> "$52,677"
export function dollars(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

// 0.6543 -> "0.65"
export function num(value: number | null, digits = 2): string {
  if (value === null || Number.isNaN(value)) return '—'
  return value.toFixed(digits)
}