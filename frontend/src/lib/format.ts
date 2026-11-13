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

// 52677 -> "$53K" (for chart axes, where space is tight)
export function dollarsCompact(value: number): string {
  return '$' + value.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 })
}

// 0.6543 -> "0.65"
export function num(value: number | null, digits = 2): string {
  if (value === null || Number.isNaN(value)) return '—'
  return value.toFixed(digits)
}

// "2008-09-29" -> "Sep 29, 2008"
export function longDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// "2008-09-29" -> "2008"
export function year(iso: string): string {
  return iso.slice(0, 4)
}

// 0.0747 -> "+7.47%" (signed, for returns that can go either way)
export function signedPct(value: number | null, digits = 1): string {
  if (value === null || Number.isNaN(value)) return '—'
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${Math.abs(value * 100).toFixed(digits)}%`
}

// 45 -> "45 days", 400 -> "13 months", 1600 -> "4.4 years"
export function duration(days: number): string {
  if (days === 0) return 'none'
  if (days < 60) return `${days} days`
  if (days < 730) return `${Math.round(days / 30.44)} months`
  return `${(days / 365.25).toFixed(1)} years`
}
