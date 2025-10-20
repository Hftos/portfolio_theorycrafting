import { useState } from "react";
import { postJSON } from "./lib/api";

type MetricsResponse = {
  correlation: Record<string, Record<string, number>>;
  date_range: {
    start: string;
    end: string;
  };
  num_observations: number;
};

function parseTickers(input: string): string[] {
  return input.split(",").map(t => t.trim().toUpperCase()).filter(Boolean);
}

export default function App() {
  const [tickersText, setTickersText] = useState("SPY,AGG,VTI");
  const [start, setStart] = useState("2020-01-01");
  const [end, setEnd] = useState("2020-04-01");

  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMetrics(null);

    const tickers = parseTickers(tickersText);

    if (tickers.length === 0) {
      setError("Please enter at least one ticker.");
      setLoading(false);
      return;
    }

    // Create weights array with dummy value of 1.0 for each ticker (not used by backend)
    const weights = tickers.map((t) => ({ ticker: t, weight: 1.0 }));

    try {
      const data = await postJSON<MetricsResponse>("/metrics", {
        weights,
        start,
        end,
      });
      setMetrics(data);
    } catch (err: any) {
      // Extract meaningful error message
      let errorMsg = "Request failed.";
      if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
      console.error("Error fetching metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui, sans-serif", padding: "0 20px" }}>
      <h1>Returns Correlation Matrix</h1>
      <p style={{ color: "#888", fontSize: "0.95em" }}>
        Analyze daily log return correlations across tickers using local CSV data.
      </p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontWeight: 500 }}>Tickers (comma-separated)</span>
          <input
            value={tickersText}
            onChange={e => setTickersText(e.target.value)}
            placeholder="SPY,AGG,VTI"
            style={{ padding: 10, fontSize: "1em", borderRadius: 4, border: "1px solid #ccc" }}
          />
        </label>

        <div style={{ display: "flex", gap: 12 }}>
          <label style={{ flex: 1, display: "grid", gap: 4 }}>
            <span style={{ fontWeight: 500 }}>Start Date</span>
            <input
              type="date"
              value={start}
              onChange={e => setStart(e.target.value)}
              style={{ padding: 10, fontSize: "1em", borderRadius: 4, border: "1px solid #ccc" }}
            />
          </label>
          <label style={{ flex: 1, display: "grid", gap: 4 }}>
            <span style={{ fontWeight: 500 }}>End Date</span>
            <input
              type="date"
              value={end}
              onChange={e => setEnd(e.target.value)}
              style={{ padding: 10, fontSize: "1em", borderRadius: 4, border: "1px solid #ccc" }}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 24px",
            fontSize: "1em",
            marginTop: 8,
            backgroundColor: loading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 500
          }}
        >
          {loading ? "Computing..." : "Compute Correlation Matrix"}
        </button>
      </form>

      {loading && (
        <div style={{ marginTop: 24, padding: 16, backgroundColor: "#f0f8ff", border: "1px solid #cce5ff", borderRadius: 8, color: "#004085" }}>
          <p style={{ margin: 0 }}>Loading data from CSV files...</p>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 24, padding: 16, backgroundColor: "#fee", border: "1px solid #fcc", borderRadius: 8 }}>
          <p style={{ color: "#c00", margin: 0, fontWeight: 500 }}>Error:</p>
          <p style={{ color: "#c00", margin: "8px 0 0 0" }}>{error}</p>
        </div>
      )}

      {metrics && (
        <div style={{
          marginTop: 24,
          padding: 20,
          backgroundColor: "white",
          border: "1px solid #ddd",
          borderRadius: 8,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Correlation Matrix</h2>

          <CorrelationTable correlation={metrics.correlation} />

          <div style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: "1px solid #eee",
            fontSize: "0.85em",
            color: "#666"
          }}>
            Overlap: {metrics.date_range.start} → {metrics.date_range.end} ({metrics.num_observations.toLocaleString()} days)
          </div>
        </div>
      )}
    </div>
  );
}

function CorrelationTable({ correlation }: { correlation: Record<string, Record<string, number>> }) {
  const tickers = Object.keys(correlation).sort();

  if (tickers.length === 0) {
    return <p>No correlation data available.</p>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "0.9em"
      }}>
        <thead>
          <tr>
            <th style={{
              padding: "8px 12px",
              textAlign: "left",
              borderBottom: "2px solid #333",
              fontWeight: 600
            }}>
              Ticker
            </th>
            {tickers.map(ticker => (
              <th key={ticker} style={{
                padding: "8px 12px",
                textAlign: "center",
                borderBottom: "2px solid #333",
                fontWeight: 600
              }}>
                {ticker}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tickers.map((rowTicker, rowIndex) => (
            <tr key={rowTicker} style={{
              backgroundColor: rowIndex % 2 === 0 ? "#f9f9f9" : "white"
            }}>
              <td style={{
                padding: "8px 12px",
                fontWeight: 600,
                borderRight: "1px solid #ddd"
              }}>
                {rowTicker}
              </td>
              {tickers.map(colTicker => {
                const value = correlation[rowTicker]?.[colTicker] ?? 0;
                const isDiagonal = rowTicker === colTicker;
                return (
                  <td key={colTicker} style={{
                    padding: "8px 12px",
                    textAlign: "center",
                    backgroundColor: isDiagonal ? "#e6f3ff" : undefined,
                    fontWeight: isDiagonal ? 600 : 400
                  }}>
                    {value.toFixed(2)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}