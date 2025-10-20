import { useState } from "react";
import { postJSON } from "./lib/api";

// Type definitions for API responses
type AllocationItem = {
  ticker: string;
  weight: number;
};

type AllocationsResponse = {
  allocations: AllocationItem[];
  date_range: { start: string; end: string };
  num_observations: number;
};

type CorrelationResponse = {
  correlation: Record<string, Record<string, number>>;
  date_range: { start: string; end: string };
  num_observations: number;
};

type ReturnsResponse = {
  dates: string[];
  portfolio_values: number[];
  individual_values: Record<string, number[]>;
  date_range: { start: string; end: string };
  num_observations: number;
};

type DrawdownResponse = {
  dates: string[];
  drawdown_pct: number[];
  max_drawdown: number;
  date_range: { start: string; end: string };
  num_observations: number;
};

type DashboardData = {
  allocations: AllocationsResponse | null;
  correlation: CorrelationResponse | null;
  returns: ReturnsResponse | null;
  drawdown: DrawdownResponse | null;
};

function parseTickers(input: string): string[] {
  return input.split(",").map(t => t.trim().toUpperCase()).filter(Boolean);
}

export default function App() {
  const [tickersText, setTickersText] = useState("SPY,AGG,VTI");
  const [start, setStart] = useState("2020-01-01");
  const [end, setEnd] = useState("2020-04-01");

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardData>({
    allocations: null,
    correlation: null,
    returns: null,
    drawdown: null
  });
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData({ allocations: null, correlation: null, returns: null, drawdown: null });

    const tickers = parseTickers(tickersText);

    if (tickers.length === 0) {
      setError("Please enter at least one ticker.");
      setLoading(false);
      return;
    }

    // Create weights array (values don't matter, backend uses equal weight)
    const weights = tickers.map((t) => ({ ticker: t, weight: 1.0 }));
    const payload = { weights, start, end };

    try {
      // Fetch all four endpoints in parallel
      const [allocationsData, correlationData, returnsData, drawdownData] = await Promise.all([
        postJSON<AllocationsResponse>("/allocations", payload),
        postJSON<CorrelationResponse>("/correlation", payload),
        postJSON<ReturnsResponse>("/returns", payload),
        postJSON<DrawdownResponse>("/drawdown", payload),
      ]);

      setData({
        allocations: allocationsData,
        correlation: correlationData,
        returns: returnsData,
        drawdown: drawdownData,
      });
    } catch (err: any) {
      setError(err.message || "Request failed.");
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: "20px auto", fontFamily: "system-ui, sans-serif", padding: "0 20px" }}>
      <h1 style={{ marginBottom: 8 }}>Portfolio Analytics Dashboard</h1>
      <p style={{ color: "#666", fontSize: "0.9em", marginTop: 0 }}>
        Equal-weight portfolio analysis using local CSV data
      </p>

      <form onSubmit={onSubmit} style={{ display: "flex", gap: 12, marginTop: 20, marginBottom: 24 }}>
        <input
          value={tickersText}
          onChange={e => setTickersText(e.target.value)}
          placeholder="Tickers (e.g., SPY,AGG,VTI)"
          style={{ flex: 2, padding: 10, fontSize: "0.95em", borderRadius: 4, border: "1px solid #ccc" }}
        />
        <input
          type="date"
          value={start}
          onChange={e => setStart(e.target.value)}
          style={{ flex: 1, padding: 10, fontSize: "0.95em", borderRadius: 4, border: "1px solid #ccc" }}
        />
        <input
          type="date"
          value={end}
          onChange={e => setEnd(e.target.value)}
          style={{ flex: 1, padding: 10, fontSize: "0.95em", borderRadius: 4, border: "1px solid #ccc" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 24px",
            fontSize: "0.95em",
            backgroundColor: loading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600
          }}
        >
          {loading ? "Loading..." : "Analyze"}
        </button>
      </form>

      {error && (
        <div style={{ padding: 16, backgroundColor: "#fee", border: "1px solid #fcc", borderRadius: 8, marginBottom: 24 }}>
          <p style={{ color: "#c00", margin: 0, fontWeight: 500 }}>Error: {error}</p>
        </div>
      )}

      {data.allocations && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(600px, 1fr))", gap: 20 }}>
          <AllocationsCard data={data.allocations} />
          <CorrelationCard data={data.correlation!} />
          <ReturnsCard data={data.returns!} />
          <DrawdownCard data={data.drawdown!} />
        </div>
      )}
    </div>
  );
}

// Allocations Card with Pie Chart
function AllocationsCard({ data }: { data: AllocationsResponse }) {
  const total = data.allocations.reduce((sum, item) => sum + item.weight, 0);
  let currentAngle = -90; // Start at top

  const slices = data.allocations.map((item, i) => {
    const percentage = item.weight / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    currentAngle += angle;

    // Calculate slice path
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const radius = 80;
    const cx = 100;
    const cy = 100;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    const colors = ["#4285F4", "#34A853", "#FBBC05", "#EA4335", "#9C27B0", "#FF6D00"];
    const color = colors[i % colors.length];

    return { d, color, item };
  });

  return (
    <Card title="Portfolio Allocation" subtitle={`Equal-weight across ${data.allocations.length} tickers`}>
      <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          {slices.map((slice, i) => (
            <path key={i} d={slice.d} fill={slice.color} stroke="white" strokeWidth="2" />
          ))}
        </svg>

        <div style={{ flex: 1 }}>
          {slices.map((slice, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 16, height: 16, backgroundColor: slice.color, borderRadius: 2 }} />
              <span style={{ fontWeight: 600 }}>{slice.item.ticker}</span>
              <span style={{ color: "#666" }}>{slice.item.weight.toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </div>
      <Caption start={data.date_range.start} end={data.date_range.end} days={data.num_observations} />
    </Card>
  );
}

// Correlation Card with Heatmap
function CorrelationCard({ data }: { data: CorrelationResponse }) {
  const tickers = Object.keys(data.correlation).sort();
  const cellSize = 60;

  const getColor = (value: number) => {
    if (value >= 0.8) return "#1a5490";
    if (value >= 0.6) return "#3a7ebf";
    if (value >= 0.4) return "#6ba3d8";
    if (value >= 0.2) return "#9cc4e8";
    if (value >= 0) return "#cde3f5";
    if (value >= -0.2) return "#f5e4cd";
    if (value >= -0.4) return "#e8c49c";
    if (value >= -0.6) return "#d8a36b";
    if (value >= -0.8) return "#bf7e3a";
    return "#90541a";
  };

  return (
    <Card title="Returns Correlation Matrix" subtitle="Daily log return correlations">
      <div style={{ overflowX: "auto" }}>
        <svg width={tickers.length * cellSize + 80} height={tickers.length * cellSize + 80}>
          {/* Column labels */}
          {tickers.map((ticker, i) => (
            <text
              key={`col-${i}`}
              x={i * cellSize + cellSize / 2 + 80}
              y={20}
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
            >
              {ticker}
            </text>
          ))}

          {/* Row labels and cells */}
          {tickers.map((rowTicker, i) => (
            <g key={`row-${i}`}>
              <text
                x={70}
                y={i * cellSize + cellSize / 2 + 40}
                textAnchor="end"
                alignmentBaseline="middle"
                fontSize="12"
                fontWeight="600"
              >
                {rowTicker}
              </text>

              {tickers.map((colTicker, j) => {
                const value = data.correlation[rowTicker]?.[colTicker] ?? 0;
                const color = getColor(value);

                return (
                  <g key={`cell-${i}-${j}`}>
                    <rect
                      x={j * cellSize + 80}
                      y={i * cellSize + 30}
                      width={cellSize}
                      height={cellSize}
                      fill={color}
                      stroke="#fff"
                      strokeWidth="2"
                    />
                    <text
                      x={j * cellSize + cellSize / 2 + 80}
                      y={i * cellSize + cellSize / 2 + 35}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill={value >= 0.5 || value <= -0.5 ? "white" : "black"}
                    >
                      {value.toFixed(2)}
                    </text>
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
      </div>
      <Caption start={data.date_range.start} end={data.date_range.end} days={data.num_observations} />
    </Card>
  );
}

// Returns Card with Line Chart
function ReturnsCard({ data }: { data: ReturnsResponse }) {
  const width = 700;
  const height = 300;
  const padding = { top: 20, right: 120, bottom: 40, left: 50 };

  const allValues = [
    ...data.portfolio_values,
    ...Object.values(data.individual_values).flat()
  ].filter(v => v !== null);

  const minY = Math.min(...allValues) * 0.98;
  const maxY = Math.max(...allValues) * 1.02;

  const xScale = (i: number) => padding.left + (i / (data.dates.length - 1)) * (width - padding.left - padding.right);
  const yScale = (v: number) => height - padding.bottom - ((v - minY) / (maxY - minY)) * (height - padding.top - padding.bottom);

  const createPath = (values: number[]) => {
    return values.map((v, i) => {
      const x = xScale(i);
      const y = yScale(v);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(" ");
  };

  const tickers = Object.keys(data.individual_values).sort();
  const colors = ["#888", "#4285F4", "#34A853", "#FBBC05", "#EA4335", "#9C27B0"];

  return (
    <Card title="Cumulative Returns" subtitle="Normalized to 1.0 at start">
      <svg width={width} height={height}>
        {/* Y-axis grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
          const y = yScale(minY + (maxY - minY) * ratio);
          const value = minY + (maxY - minY) * ratio;
          return (
            <g key={ratio}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#eee" />
              <text x={padding.left - 10} y={y} textAnchor="end" alignmentBaseline="middle" fontSize="11" fill="#666">
                {value.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* X-axis */}
        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#333" />
        <text x={padding.left} y={height - 10} fontSize="11" fill="#666">{data.dates[0]}</text>
        <text x={width - padding.right} y={height - 10} textAnchor="end" fontSize="11" fill="#666">{data.dates[data.dates.length - 1]}</text>

        {/* Individual ticker lines */}
        {tickers.map((ticker, i) => (
          <path
            key={ticker}
            d={createPath(data.individual_values[ticker])}
            stroke={colors[(i + 1) % colors.length]}
            strokeWidth="1.5"
            fill="none"
            opacity="0.6"
          />
        ))}

        {/* Portfolio line (thicker, on top) */}
        <path
          d={createPath(data.portfolio_values)}
          stroke="#000"
          strokeWidth="3"
          fill="none"
        />

        {/* Legend */}
        <g transform={`translate(${width - padding.right + 10}, ${padding.top})`}>
          <text x={0} y={0} fontSize="12" fontWeight="600">Portfolio</text>
          <line x1={0} y1={5} x2={30} y2={5} stroke="#000" strokeWidth="3" />

          {tickers.map((ticker, i) => (
            <g key={ticker} transform={`translate(0, ${20 + i * 20})`}>
              <text x={0} y={0} fontSize="11" fill="#666">{ticker}</text>
              <line x1={0} y1={5} x2={30} y2={5} stroke={colors[(i + 1) % colors.length]} strokeWidth="1.5" opacity="0.6" />
            </g>
          ))}
        </g>
      </svg>
      <Caption start={data.date_range.start} end={data.date_range.end} days={data.num_observations} />
    </Card>
  );
}

// Drawdown Card with Area Chart
function DrawdownCard({ data }: { data: DrawdownResponse }) {
  const width = 700;
  const height = 300;
  const padding = { top: 20, right: 40, bottom: 40, left: 50 };

  const minY = Math.min(...data.drawdown_pct, 0);
  const maxY = 5;

  const xScale = (i: number) => padding.left + (i / (data.dates.length - 1)) * (width - padding.left - padding.right);
  const yScale = (v: number) => height - padding.bottom - ((v - minY) / (maxY - minY)) * (height - padding.top - padding.bottom);

  const createPath = () => {
    const baseline = yScale(0);
    let path = `M ${padding.left} ${baseline} `;

    data.drawdown_pct.forEach((v, i) => {
      const x = xScale(i);
      const y = yScale(v);
      path += `L ${x} ${y} `;
    });

    path += `L ${xScale(data.drawdown_pct.length - 1)} ${baseline} Z`;
    return path;
  };

  return (
    <Card title="Portfolio Drawdown" subtitle={`Max drawdown: ${data.max_drawdown.toFixed(2)}%`}>
      <svg width={width} height={height}>
        {/* Y-axis grid lines */}
        {[0, -5, -10, -15, -20].map(value => {
          const y = yScale(value);
          return (
            <g key={value}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#eee" />
              <text x={padding.left - 10} y={y} textAnchor="end" alignmentBaseline="middle" fontSize="11" fill="#666">
                {value}%
              </text>
            </g>
          );
        })}

        {/* X-axis */}
        <line x1={padding.left} y1={yScale(0)} x2={width - padding.right} y2={yScale(0)} stroke="#333" strokeWidth="2" />
        <text x={padding.left} y={height - 10} fontSize="11" fill="#666">{data.dates[0]}</text>
        <text x={width - padding.right} y={height - 10} textAnchor="end" fontSize="11" fill="#666">{data.dates[data.dates.length - 1]}</text>

        {/* Area fill */}
        <path d={createPath()} fill="#ff6b6b" opacity="0.3" />

        {/* Line */}
        <path
          d={data.drawdown_pct.map((v, i) => {
            const x = xScale(i);
            const y = yScale(v);
            return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
          }).join(" ")}
          stroke="#c92a2a"
          strokeWidth="2"
          fill="none"
        />
      </svg>
      <Caption start={data.date_range.start} end={data.date_range.end} days={data.num_observations} />
    </Card>
  );
}

// Reusable Card Component
function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: "white",
      border: "1px solid #ddd",
      borderRadius: 8,
      padding: 20,
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ margin: 0, marginBottom: 4, fontSize: "1.1em" }}>{title}</h2>
      <p style={{ margin: 0, marginBottom: 16, fontSize: "0.85em", color: "#666" }}>{subtitle}</p>
      {children}
    </div>
  );
}

// Caption Component
function Caption({ start, end, days }: { start: string; end: string; days: number }) {
  return (
    <div style={{
      marginTop: 12,
      paddingTop: 12,
      borderTop: "1px solid #eee",
      fontSize: "0.75em",
      color: "#999"
    }}>
      Overlap: {start} → {end} ({days.toLocaleString()} days)
    </div>
  );
}
