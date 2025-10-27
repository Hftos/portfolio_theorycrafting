/**
 * TypeScript types matching the backend API schemas
 */

export interface SeriesPoint {
  date: string; // ISO date string
  price: number;
  total_return?: number | null;
  dividend?: number | null;
}

export type AssetClass = "EQUITY" | "BOND" | "ETF" | "CASH";
export type RebalanceFreq = "NONE" | "ANNUAL" | "QUARTERLY" | "MONTHLY";
export type TaxMode = "TAX_DEFERRED" | "TAXABLE";
export type Objective = "GROWTH" | "BALANCED" | "INCOME" | "PRESERVATION";

export interface PortfolioHolding {
  ticker: string;
  asset_class: AssetClass;
  weight_pct: number; // 0-100
}

export interface Assumptions {
  expense_ratio_bps: number;
  slippage_bps: number;
  tax_mode: TaxMode;
  short_term_rate: number;
  long_term_rate: number;
  rf_rate: number;
}

export interface SimRequest {
  holdings: PortfolioHolding[];
  rebalance: RebalanceFreq;
  start: string;
  end: string;
  use_dividends: boolean;
  log_scale: boolean;
  inflation_adjust: boolean;
  benchmarks: string[];
  benchmark_ref: string;
  assumptions: Assumptions;
  objective: Objective;
  risk_tolerance: number; // 1-10
}

export interface Summary {
  cagr: number | null; // percentage
  volatility: number | null;
  max_drawdown: number | null;
  ulcer_index: number | null;
  sharpe_ratio: number | null;
  sortino_ratio: number | null;
  hit_rate: number | null;
  best_year: number | null;
  worst_year: number | null;
  var_5pct: number | null;
  cvar_5pct: number | null;
  var_1pct: number | null;
  cvar_1pct: number | null;
  beta: number | null;
  alpha: number | null;
  weighted_expense_ratio: number;
  current_yield: number;
  hhi: number | null;
  largest_weight: number | null;
}

export interface Diagnostics {
  drawdown_series: Array<{ date: string; value: number | null }>;
  rolling_36m_return: Array<{ date: string; value: number | null }>;
  rolling_36m_volatility: Array<{ date: string; value: number | null }>;
  rolling_36m_sharpe: Array<{ date: string; value: number | null }>;
  return_histogram: {
    counts: number[];
    bins: number[];
  };
  correlation_matrix: Record<string, Record<string, number | null>>;
  risk_contribution: Record<string, number | null>;
  variance_by_asset: Record<string, number | null>;
  duration_convexity: Record<string, { duration: number; convexity: number }>;
  scenarios: {
    "2008_crisis": { return: number | null; recovery_days: number | null };
    march_2020: { return: number | null; recovery_days: number | null };
    "2022_rates": { return: number | null; recovery_days: number | null };
  };
}

export interface SimResponse {
  portfolio: SeriesPoint[];
  benchmarks: Record<string, SeriesPoint[]>;
  summary: Summary;
  diagnostics: Diagnostics;
}
