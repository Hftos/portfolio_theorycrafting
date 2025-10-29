import { type CSSProperties } from "react";

export type MetricFamily = "return" | "risk" | "drawdown" | "neutral";

interface MetricTileProps {
  label: string;
  value: string;
  family?: MetricFamily;
  sparklineData?: number[];
  loading?: boolean;
}

export default function MetricTile({
  label,
  value,
  family = "neutral",
  sparklineData,
  loading = false,
}: MetricTileProps) {
  const familyColors: Record<MetricFamily, { indicator: string; sparkline: string }> = {
    return: {
      indicator: "var(--color-return)",
      sparkline: "var(--accent-blue)",
    },
    risk: {
      indicator: "var(--color-risk)",
      sparkline: "var(--accent-coral)",
    },
    drawdown: {
      indicator: "var(--color-risk)",
      sparkline: "var(--accent-coral)",
    },
    neutral: {
      indicator: "var(--color-context)",
      sparkline: "var(--accent-beige)",
    },
  };

  const colors = familyColors[family];

  // Generate SVG path for sparkline
  const generateSparklinePath = (data: number[]) => {
    if (!data || data.length === 0) return "";

    const width = 100;
    const height = 24;
    const padding = 2;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  };

  if (loading) {
    return (
      <div style={tileStyle}>
        <div style={{ ...indicatorStyle, background: "var(--border-color)" }} />
        <div style={contentStyle}>
          <div style={{ ...labelStyle, background: "var(--border-subtle)", borderRadius: "4px", height: "14px", width: "60%" }} />
          <div style={{ ...valueStyle, background: "var(--border-subtle)", borderRadius: "4px", height: "28px", width: "80%", marginTop: "8px" }} />
        </div>
      </div>
    );
  }

  return (
    <div style={tileStyle}>
      <div style={{ ...indicatorStyle, background: colors.indicator }} />
      <div style={contentStyle}>
        <div style={labelStyle}>{label}</div>
        <div style={valueStyle}>{value}</div>
        {sparklineData && sparklineData.length > 0 && (
          <svg
            viewBox="0 0 100 24"
            style={sparklineStyle}
            aria-hidden="true"
          >
            <path
              d={generateSparklinePath(sparklineData)}
              fill="none"
              stroke={colors.sparkline}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.6"
            />
          </svg>
        )}
      </div>
    </div>
  );
}

const tileStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  padding: "var(--space-md)",
  background: "var(--bg-secondary)",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border-subtle)",
  boxShadow: "var(--shadow-sm)",
  transition: "all var(--transition-base)",
  overflow: "hidden",
};

const indicatorStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  bottom: 0,
  width: "3px",
};

const contentStyle: CSSProperties = {
  flex: 1,
  marginLeft: "8px",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-xs)",
};

const labelStyle: CSSProperties = {
  fontSize: "var(--text-xs)",
  fontWeight: 500,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const valueStyle: CSSProperties = {
  fontSize: "var(--text-2xl)",
  fontWeight: 600,
  color: "var(--text-primary)",
  lineHeight: "1",
};

const sparklineStyle: CSSProperties = {
  width: "100%",
  height: "24px",
  marginTop: "var(--space-xs)",
};
