import type { PortfolioHolding, Assumptions, SimRequest } from "../types/api";

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  expense_ratio_bps: 10,
  slippage_bps: 5,
  tax_mode: "TAX_DEFERRED",
  short_term_rate: 0.0,
  long_term_rate: 0.0,
  rf_rate: 0.03,
};

export const DEFAULT_HOLDINGS: PortfolioHolding[] = [
  { ticker: "SPY", asset_class: "ETF", weight_pct: 60 },
  { ticker: "AGG", asset_class: "BOND", weight_pct: 40 },
];

export function createDefaultSimRequest(): SimRequest {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - 5);

  return {
    holdings: DEFAULT_HOLDINGS,
    rebalance: "ANNUAL",
    start: startDate.toISOString().split("T")[0],
    end: endDate.toISOString().split("T")[0],
    use_dividends: true,
    log_scale: false,
    inflation_adjust: false,
    benchmarks: ["SPY"],
    benchmark_ref: "SPY",
    assumptions: DEFAULT_ASSUMPTIONS,
    objective: "BALANCED",
    risk_tolerance: 5,
  };
}

export function normalizeWeights(holdings: PortfolioHolding[]): PortfolioHolding[] {
  const total = holdings.reduce((sum, h) => sum + h.weight_pct, 0);
  if (total === 0) return holdings;
  
  return holdings.map(h => ({
    ...h,
    weight_pct: (h.weight_pct / total) * 100,
  }));
}

export function calculateWeightDrift(holdings: PortfolioHolding[]): number {
  const total = holdings.reduce((sum, h) => sum + h.weight_pct, 0);
  return Math.abs(total - 100);
}

export const PRESET_PORTFOLIOS: Record<string, PortfolioHolding[]> = {
  "60/40": [
    { ticker: "SPY", asset_class: "ETF", weight_pct: 60 },
    { ticker: "AGG", asset_class: "BOND", weight_pct: 40 },
  ],
  "All-World": [
    { ticker: "VTI", asset_class: "ETF", weight_pct: 60 },
    { ticker: "VXUS", asset_class: "ETF", weight_pct: 30 },
    { ticker: "BND", asset_class: "BOND", weight_pct: 10 },
  ],
  "Income": [
    { ticker: "SPY", asset_class: "ETF", weight_pct: 30 },
    { ticker: "AGG", asset_class: "BOND", weight_pct: 50 },
    { ticker: "VNQ", asset_class: "ETF", weight_pct: 20 },
  ],
};
