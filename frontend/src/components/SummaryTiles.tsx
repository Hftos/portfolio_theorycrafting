import type { Summary } from "../types/api";
import MetricTile, { type MetricFamily } from "./MetricTile";

interface Props {
  summary: Summary | null;
  loading: boolean;
}

interface MetricConfig {
  label: string;
  value: number | null;
  format: "pct" | "num";
  family: MetricFamily;
}

export default function SummaryTiles({ summary, loading }: Props) {
  const formatValue = (value: number | null, format: "pct" | "num"): string => {
    if (value === null || value === undefined) return "N/A";
    if (format === "pct") return `${value.toFixed(2)}%`;
    return value.toFixed(2);
  };

  // Show loading state with skeleton tiles
  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={gridStyle}>
          {Array.from({ length: 12 }).map((_, i) => (
            <MetricTile key={i} label="" value="" loading={true} />
          ))}
        </div>
      </div>
    );
  }

  if (!summary) {
    return null; // Empty state will be handled by parent
  }

  const metrics: MetricConfig[] = [
    { label: "CAGR", value: summary.cagr, format: "pct", family: "return" },
    { label: "Volatility", value: summary.volatility, format: "pct", family: "risk" },
    { label: "Sharpe Ratio", value: summary.sharpe_ratio, format: "num", family: "return" },
    { label: "Sortino Ratio", value: summary.sortino_ratio, format: "num", family: "return" },
    { label: "Max Drawdown", value: summary.max_drawdown, format: "pct", family: "drawdown" },
    { label: "Ulcer Index", value: summary.ulcer_index, format: "num", family: "drawdown" },
    { label: "Hit Rate", value: summary.hit_rate, format: "pct", family: "return" },
    { label: "VaR (5%)", value: summary.var_5pct, format: "pct", family: "risk" },
    { label: "CVaR (5%)", value: summary.cvar_5pct, format: "pct", family: "risk" },
    { label: "Beta", value: summary.beta, format: "num", family: "neutral" },
    { label: "Alpha", value: summary.alpha, format: "pct", family: "return" },
    { label: "HHI", value: summary.hhi, format: "num", family: "neutral" },
  ];

  return (
    <div style={containerStyle}>
      <div style={gridStyle}>
        {metrics.map((metric) => (
          <MetricTile
            key={metric.label}
            label={metric.label}
            value={formatValue(metric.value, metric.format)}
            family={metric.family}
          />
        ))}
      </div>
    </div>
  );
}

const containerStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "var(--space-md)",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "var(--space-md)",
};
