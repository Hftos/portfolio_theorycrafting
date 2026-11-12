// Recharts draws several lines from ONE data array, where each row holds every
// series' value for that date: { date: "2008-09-26", s0: 9500, s1: 8200, ... }.
// The backend sends one array per portfolio, so this merges them by position.
// That's safe because /api/compare runs every portfolio over the same dates.

import type { PortfolioResult } from '../types/api'

export type ChartRow = { date: string } & Record<string, number | string>

export function seriesKey(index: number): string {
  return `s${index}`
}

export function mergeSeries(portfolios: PortfolioResult[], field: 'growth' | 'drawdown'): ChartRow[] {
  const first = portfolios[0][field]
  return first.map((point, i) => {
    const row: ChartRow = { date: point.date }
    portfolios.forEach((p, j) => {
      row[seriesKey(j)] = p[field][i].value
    })
    return row
  })
}

// Every numeric value in the rows, for computing axis ranges.
export function allValues(rows: ChartRow[], count: number): number[] {
  const values: number[] = []
  for (const row of rows) {
    for (let j = 0; j < count; j++) values.push(row[seriesKey(j)] as number)
  }
  return values
}