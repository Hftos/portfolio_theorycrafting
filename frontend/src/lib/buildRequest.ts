import type { BacktestRequest } from "../types/api"
import type { HoldingRow, Settings } from "../types/portfolio"

export interface BuildResult{
    request: BacktestRequest
    problems: string[]
}

export function buildRequest(holdings: HoldingRow[], settings: Settings): BuildResult{
    const problems: string[]=[]

    if (holdings.length === 0) problems.push('Add at least one holding.')

    const tickers = holdings.map((h) => h.ticker)
    if (tickers.some((t) => t === '')) problems.push('Pick a ticker for every row')

    const duplicates = tickers.filter((t, i) => t !== '' && tickers.indexOf(t) !== i)
    if (duplicates.length > 0) problems.push('Listed more than once: ${[...new Set(duplicates)].join(',')}')

    const weights = holdings.map((h) => Number(h.weight))
    if (weights.some((w) => !(w>0))) problems.push('Every weight must be a number above 0.')

    const rf = Number(settings.riskFreeRate)
    if (!(rf >= 0 && rf <= 20)) problems.push('Risk-free rate must be between 0% and 20%.')

    if (settings.startDate && settings.endDate && settings.startDate >= settings.endDate){
        problems.push('Start date must be before end date.')
    }

    const request: BacktestRequest = {
        holdings: holdings.map((h, i)=> ({ticker: h.ticker, weight: weights[i]})),
        start_date: settings.startDate || null,
        end_date: settings.endDate || null,
        rebalance: settings.rebalance,
        risk_free_rate: rf / 100,
    }

    return {request,problems}
}