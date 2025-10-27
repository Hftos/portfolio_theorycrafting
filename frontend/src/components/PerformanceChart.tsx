import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { SeriesPoint } from "../types/api";

interface Props {
  portfolio: SeriesPoint[];
  benchmarks: Record<string, SeriesPoint[]>;
  logScale: boolean;
  onLogScaleChange: (value: boolean) => void;
}

export default function PerformanceChart({ portfolio, benchmarks, logScale, onLogScaleChange }: Props) {
  if (!portfolio || portfolio.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>No performance data available. Run a simulation to see results.</p>
      </div>
    );
  }

  // Combine portfolio and benchmark data
  const chartData = portfolio.map((point, index) => {
    const dataPoint: any = {
      date: point.date,
      portfolio: point.price,
    };

    // Add benchmark data
    Object.keys(benchmarks).forEach((benchKey) => {
      const benchSeries = benchmarks[benchKey];
      if (benchSeries[index]) {
        dataPoint[benchKey] = benchSeries[index].price;
      }
    });

    return dataPoint;
  });

  return (
    <div style={{ padding: "20px", background: "#fff", borderRadius: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2>Portfolio Performance</h2>
        <div>
          <label style={{ marginRight: "16px" }}>
            <input
              type="checkbox"
              checked={logScale}
              onChange={(e) => onLogScaleChange(e.target.checked)}
            />{" "}
            Log Scale
          </label>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
            }}
          />
          <YAxis
            scale={logScale ? "log" : "linear"}
            domain={logScale ? ['auto', 'auto'] : [0.5, 'auto']}
            tickFormatter={(value) => value.toFixed(2)}
          />
          <Tooltip
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
            formatter={(value: any) => value.toFixed(4)}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="portfolio"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
            name="Portfolio"
          />
          {Object.keys(benchmarks).map((benchKey, index) => (
            <Line
              key={benchKey}
              type="monotone"
              dataKey={benchKey}
              stroke={index === 0 ? "#3b82f6" : "#10b981"}
              strokeWidth={1}
              dot={false}
              name={benchKey}
              strokeDasharray="5 5"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
