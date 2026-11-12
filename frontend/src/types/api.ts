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
  max_drawdown: number
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