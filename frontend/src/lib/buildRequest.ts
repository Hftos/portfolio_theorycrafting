// Turns what's on the page into a CompareRequest, and lists anything that needs fixing first.

import type { CompareRequest, Holding } from '../types/api'
import type { Comparison, HoldingRow, Settings } from '../types/portfolio'

export const YOUR_PORTFOLIO = 'Your portfolio'

export interface BuildResult {
  request: CompareRequest
  problems: string[] // empty = ready to send
}

// Check one portfolio's rows. `label` prefixes messages for comparisons ("60/40: ...").
function checkHoldings(rows: HoldingRow[], label: string, problems: string[]): Holding[] {
  const prefix = label === YOUR_PORTFOLIO ? '' : `${label}: `

  if (rows.length === 0) problems.push(`${prefix}Add at least one holding.`)

  const tickers = rows.map((r) => r.ticker)
  if (tickers.some((t) => t === '')) problems.push(`${prefix}Pick a ticker for every row.`)

  const duplicates = tickers.filter((t, i) => t !== '' && tickers.indexOf(t) !== i)
  if (duplicates.length > 0) {
    problems.push(`${prefix}Listed more than once: ${[...new Set(duplicates)].join(', ')}`)
  }

  const weights = rows.map((r) => Number(r.weight))
  if (weights.some((w) => !(w > 0))) problems.push(`${prefix}Every weight must be a number above 0.`)

  return rows.map((r, i) => ({ ticker: r.ticker, weight: weights[i] }))
}

export function buildRequest(holdings: HoldingRow[], comparisons: Comparison[], settings: Settings): BuildResult {
  const problems: string[] = []

  const portfolios = [
    { name: YOUR_PORTFOLIO, holdings: checkHoldings(holdings, YOUR_PORTFOLIO, problems) },
    ...comparisons.map((c) => ({ name: c.name.trim(), holdings: checkHoldings(c.holdings, c.name.trim() || 'Comparison', problems) })),
  ]

  const names = portfolios.map((p) => p.name)
  if (names.some((n) => n === '')) problems.push('Give every comparison a name.')
  const repeated = names.filter((n, i) => n !== '' && names.indexOf(n) !== i)
  if (repeated.length > 0) problems.push(`Each portfolio needs a different name: ${[...new Set(repeated)].join(', ')}`)

  const rf = Number(settings.riskFreeRate)
  if (!(rf >= 0 && rf <= 20)) problems.push('Risk-free rate must be between 0% and 20%.')

  if (settings.startDate && settings.endDate && settings.startDate >= settings.endDate) {
    problems.push('Start date must be before end date.')
  }

  const request: CompareRequest = {
    portfolios,
    start_date: settings.startDate || null,
    end_date: settings.endDate || null,
    rebalance: settings.rebalance,
    risk_free_rate: rf / 100, // the backend wants a decimal: 2% -> 0.02
  }

  return { request, problems }
}