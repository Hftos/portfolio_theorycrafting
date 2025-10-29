import { useState, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { SeriesPoint } from "../types/api";
import CorrelationGridMotif from "./CorrelationGridMotif";

interface Props {
  portfolio: SeriesPoint[];
  benchmarks: Record<string, SeriesPoint[]>;
  logScale: boolean;
  onLogScaleChange: (value: boolean) => void;
}

export default function PerformanceChart({ portfolio, benchmarks, logScale, onLogScaleChange }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>({
    portfolio: true,
    ...Object.keys(benchmarks).reduce((acc, key) => ({ ...acc, [key]: true }), {}),
  });

  if (!portfolio || portfolio.length === 0) {
    return null;
  }

  // Normalize all series to start at 1.0 (100%)
  const normalizeToOne = (series: SeriesPoint[]): SeriesPoint[] => {
    if (series.length === 0) return [];
    const firstPrice = series[0].price;
    return series.map((point) => ({
      ...point,
      price: point.price / firstPrice,
    }));
  };

  const normalizedPortfolio = normalizeToOne(portfolio);
  const normalizedBenchmarks: Record<string, SeriesPoint[]> = {};
  Object.keys(benchmarks).forEach((key) => {
    normalizedBenchmarks[key] = normalizeToOne(benchmarks[key]);
  });

  // Combine portfolio and benchmark data
  const chartData = normalizedPortfolio.map((point, index) => {
    const dataPoint: any = {
      date: point.date,
      portfolio: point.price,
    };

    Object.keys(normalizedBenchmarks).forEach((benchKey) => {
      const benchSeries = normalizedBenchmarks[benchKey];
      if (benchSeries[index]) {
        dataPoint[benchKey] = benchSeries[index].price;
      }
    });

    return dataPoint;
  });

  const handleDownloadImage = () => {
    // Simple implementation - could be enhanced with html2canvas or similar
    alert("Download image feature - would export chart as PNG");
  };

  const handleResetZoom = () => {
    // Recharts doesn't have built-in zoom reset, but we can trigger a re-render
    alert("Reset zoom feature - would reset chart view");
  };

  const toggleSeries = (seriesName: string) => {
    setVisibleSeries((prev) => ({
      ...prev,
      [seriesName]: !prev[seriesName],
    }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-sm)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <p style={{ margin: "0 0 8px", fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
          {new Date(label).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
        {payload.map((entry: any) => (
          <div
            key={entry.dataKey}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: entry.color,
              }}
            />
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
              {entry.name}: {entry.value.toFixed(4)} ({((entry.value - 1) * 100).toFixed(2)}%)
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={containerStyle} ref={chartRef}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0 }}>Portfolio Performance</h2>
        <div style={toolbarStyle}>
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={logScale}
              onChange={(e) => onLogScaleChange(e.target.checked)}
            />
            <span>Log Scale</span>
          </label>
          <button
            onClick={handleDownloadImage}
            className="secondary"
            style={toolbarButtonStyle}
            aria-label="Download chart as image"
          >
            ⬇
          </button>
          <button
            onClick={handleResetZoom}
            className="secondary"
            style={toolbarButtonStyle}
            aria-label="Reset chart zoom"
          >
            ↺
          </button>
        </div>
      </div>

      <div style={chartContainerStyle}>
        <CorrelationGridMotif />
        <ResponsiveContainer width="100%" height={450}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" opacity={0.5} />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
              }}
              stroke="var(--text-tertiary)"
              style={{ fontSize: "var(--text-xs)" }}
            />
            <YAxis
              scale={logScale ? "log" : "linear"}
              domain={["auto", "auto"]}
              tickFormatter={(value) => value.toFixed(2)}
              stroke="var(--text-tertiary)"
              style={{ fontSize: "var(--text-xs)" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              onClick={(e: any) => e.dataKey && toggleSeries(e.dataKey)}
              wrapperStyle={{ cursor: "pointer", fontSize: "var(--text-sm)" }}
            />
            {visibleSeries.portfolio && (
              <Line
                type="monotone"
                dataKey="portfolio"
                stroke="var(--accent-blue)"
                strokeWidth={2.5}
                dot={false}
                name="Portfolio"
                isAnimationActive={false}
              />
            )}
            {Object.keys(normalizedBenchmarks).map((benchKey, index) =>
              visibleSeries[benchKey] ? (
                <Line
                  key={benchKey}
                  type="monotone"
                  dataKey={benchKey}
                  stroke={index === 0 ? "var(--accent-coral)" : "var(--accent-beige)"}
                  strokeWidth={1.5}
                  dot={false}
                  name={benchKey}
                  strokeDasharray="5 5"
                  isAnimationActive={false}
                />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const containerStyle = {
  background: "var(--bg-secondary)",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border-subtle)",
  padding: "var(--space-lg)",
  boxShadow: "var(--shadow-sm)",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "var(--space-lg)",
  flexWrap: "wrap" as const,
  gap: "var(--space-md)",
};

const toolbarStyle = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-sm)",
};

const checkboxLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "var(--text-sm)",
  cursor: "pointer",
  userSelect: "none" as const,
};

const toolbarButtonStyle = {
  padding: "6px 12px",
  minWidth: "unset",
};

const chartContainerStyle = {
  position: "relative" as const,
};
