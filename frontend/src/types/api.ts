export type Rebalance = 'none' | 'monthly' | 'quarterly' | 'annual'

export interface Holding {
    ticker: string
    weight: number
}

export interface BacktestRequest{
    holdings: Holding[]
    start_date?: string | null
    end_date?: string | null
    rebalance?: Rebalance
    risk_free_rate?: number
    start_vault?: number
}

export interface Metrics{
    total_return: number
    cagr: number
    volatility: number
    sharpe_ratio: number | null
    max_drawdown: number
}

export interface Point{
    date: string
    value: number
}

export interface BacktestResponse{
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

export interface Security{
    ticker: string
    first_date: string
    last_date: string
    num_days: number
}