// TypeScript versions of the shapes in backend/schemas.py.
// If you change a schema in Python, change it here too.

export type Rebalance = 'none' | 'monthly' | 'quarterly' | 'annual'

export interface Holding {
  ticker: string
  weight: number
}

export interface BacktestRequest {
  holdings: Holding[]
  start_date?: string | null // "YYYY-MM-DD"
  end_date?: string | null
  rebalance?: Rebalance
  risk_free_rate?: number
  start_value?: number
}

export interface Metrics {
  total_return: number
  cagr: number
  volatility: number
  sharpe_ratio: number | null
  sortino_ratio: number | null
  calmar_ratio: number | null
  max_drawdown: number
  current_drawdown: number
  longest_drawdown_days: number
  best_year: number | null // best full calendar year
  worst_year: number | null
  positive_months: number // share of months with a gain, 0-1
  beta: number | null // vs. the S&P 500; null if SPY isn't loaded
}

export interface YearReturn {
  year: number
  value: number
  partial: boolean // the data doesn't cover the whole year
}

export interface Point {
  date: string
  value: number
}

export interface BacktestResponse {
  start_date: string
  end_date: string
  weights: Record<string, number>
  rebalance: Rebalance
  metrics: Metrics
  growth: Point[]
  drawdown: Point[]
  correlation: Record<string, Record<string, number | null>>
  asset_metrics: Record<string, Metrics>
}

export interface Security {
  ticker: string
  name: string | null
  first_date: string
  last_date: string
  num_days: number
}

// ---------- Comparison (POST /api/compare, GET /api/presets) ----------

export interface PortfolioIn {
  name: string
  holdings: Holding[]
}

export interface CompareRequest {
  portfolios: PortfolioIn[]
  start_date?: string | null
  end_date?: string | null
  rebalance?: Rebalance
  risk_free_rate?: number
  start_value?: number
}

export interface PortfolioResult {
  name: string
  weights: Record<string, number>
  metrics: Metrics
  annual_returns: YearReturn[]
  growth: Point[]
  drawdown: Point[]
  correlation: Record<string, Record<string, number | null>>
  asset_metrics: Record<string, Metrics>
}

export interface CompareResponse {
  start_date: string
  end_date: string
  limited_by: string
  rebalance: Rebalance
  portfolios: PortfolioResult[]
}

export interface Preset {
  id: string
  name: string
  description: string
  holdings: Holding[]
  available: boolean
  missing: string[]
  first_date: string | null
}
