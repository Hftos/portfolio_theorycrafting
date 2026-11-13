// Rolling returns: for every week, the annualized return over the N years that ended that week.
// "If you had bought N years before this date, how did you do per year?"
// Computed here from the weekly growth series, so changing N is instant.

import { seriesKey, type ChartRow } from './series'

const DAY_MS = 24 * 60 * 60 * 1000

export function rollingReturns(growth: ChartRow[], count: number, years: number): ChartRow[] {
  const times = growth.map((r) => new Date(r.date + 'T00:00:00').getTime())
  const out: ChartRow[] = []
  let j = 0 // index of the week N years back; only ever moves forward

  for (let i = 0; i < growth.length; i++) {
    const target = times[i] - years * 365.25 * DAY_MS
    if (times[0] > target) continue // not enough history yet for this window
    while (j + 1 < i && times[j + 1] <= target) j++
    const exactYears = (times[i] - times[j]) / (365.25 * DAY_MS)

    const row: ChartRow = { date: growth[i].date }
    for (let k = 0; k < count; k++) {
      const key = seriesKey(k)
      const ratio = (growth[i][key] as number) / (growth[j][key] as number)
      row[key] = ratio ** (1 / exactYears) - 1 // annualized, like CAGR
    }
    out.push(row)
  }
  return out
}

// Worst, median and best value of one series, and the share of windows with a gain.
export function rollingSummary(rows: ChartRow[], index: number) {
  const values = rows.map((r) => r[seriesKey(index)] as number).sort((a, b) => a - b)
  return {
    worst: values[0],
    median: values[Math.floor(values.length / 2)],
    best: values[values.length - 1],
    positiveShare: values.filter((v) => v > 0).length / values.length,
  }
}
