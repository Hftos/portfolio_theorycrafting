import type { Summary } from "../types/api";

interface Props {
  summary: Summary | null;
  loading: boolean;
}

export default function SummaryTiles({ summary, loading }: Props) {
  if (loading) {
    return <div style={{ padding: "20px" }}>Loading metrics...</div>;
  }

  if (!summary) {
    return <div style={{ padding: "20px" }}>Run simulation to see metrics</div>;
  }

  const tiles = [
    { label: "CAGR", value: summary.cagr, format: "pct", color: summary.cagr && summary.cagr > 0 ? "#10b981" : "#ef4444" },
    { label: "Volatility", value: summary.volatility, format: "pct", color: "#3b82f6" },
    { label: "Sharpe Ratio", value: summary.sharpe_ratio, format: "num", color: "#8b5cf6" },
    { label: "Sortino Ratio", value: summary.sortino_ratio, format: "num", color: "#8b5cf6" },
    { label: "Max Drawdown", value: summary.max_drawdown, format: "pct", color: "#ef4444" },
    { label: "Ulcer Index", value: summary.ulcer_index, format: "num", color: "#f59e0b" },
    { label: "Hit Rate", value: summary.hit_rate, format: "pct", color: "#10b981" },
    { label: "VaR (5%)", value: summary.var_5pct, format: "pct", color: "#ef4444" },
    { label: "CVaR (5%)", value: summary.cvar_5pct, format: "pct", color: "#ef4444" },
    { label: "Beta", value: summary.beta, format: "num", color: "#6366f1" },
    { label: "Alpha", value: summary.alpha, format: "pct", color: summary.alpha && summary.alpha > 0 ? "#10b981" : "#ef4444" },
    { label: "HHI", value: summary.hhi, format: "num", color: "#f59e0b" },
  ];

  const formatValue = (value: number | null, format: string) => {
    if (value === null || value === undefined) return "N/A";
    if (format === "pct") return value.toFixed(2) + "%";
    return value.toFixed(2);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Portfolio Metrics</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "16px",
          marginTop: "16px",
        }}
      >
        {tiles.map((tile) => (
          <div
            key={tile.label}
            style={{
              padding: "16px",
              background: "#fff",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              borderLeft: `4px solid ${tile.color}`,
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
              {tile.label}
            </div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: tile.color }}>
              {formatValue(tile.value, tile.format)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
