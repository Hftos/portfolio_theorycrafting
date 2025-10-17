import { useState } from "react";
import { postJSON } from "./lib/api";

type MetricsResponse = {
  annual_return: number;
  annual_vol: number;
  sharpe: number;
  max_drawdown: number;
  correlation: Record<string, Record<string, number>>;
};

function parseTickers(input: string): string[] {
  return input.split(",").map(t => t.trim().toUpperCase()).filter(Boolean);
}

function parseWeights(input: string): number[] {
  return input.split(",").map(w => Number(w.trim())).filter(w => !Number.isNaN(w));
}

export default function App() {
  const [tickersText, setTickersText] = useState("SPY,AGG");
  const [weightsText, setWeightsText] = useState("60,40");
  const [start, setStart] = useState("2020-01-01");
  const [end, setEnd] = useState("2024-12-31");

  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMetrics(null);

    const tickers = parseTickers(tickersText);
    const weightsArr = parseWeights(weightsText);
    
    if (tickers.length === 0) {
      setError("Please enter at least one ticker.");
      setLoading(false);
      return;
    }

    if (tickers.length !== weightsArr.length) {
      setError("Tickers and weights count must match.");
      setLoading(false);
      return;
    }

    const weights = tickers.map((t, i) => ({ ticker: t, weight: weightsArr[i] }));

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
    <div style={{ maxWidth: 800, margin: "40px auto", fontFamily: "system-ui, sans-serif", padding: "0 20px" }}>
      <h1>Portfolio Theorycrafting</h1>
      <p style={{ color: "#888", fontSize: "0.9em" }}>
        Enter tickers and weights to analyze portfolio metrics. Note: Data fetching may take 10-30 seconds due to API rate limits.
      </p>
      
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontWeight: 500 }}>Tickers (comma-separated)</span>
          <input 
            value={tickersText} 
            onChange={e => setTickersText(e.target.value)}
            placeholder="SPY,AGG,VTI"
            style={{ padding: 8, fontSize: "1em" }}
          />
        </label>
        
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontWeight: 500 }}>Weights (comma-separated, same length)</span>
          <input 
            value={weightsText} 
            onChange={e => setWeightsText(e.target.value)}
            placeholder="60,40"
            style={{ padding: 8, fontSize: "1em" }}
          />
        </label>
        
        <div style={{ display: "flex", gap: 12 }}>
          <label style={{ flex: 1, display: "grid", gap: 4 }}>
            <span style={{ fontWeight: 500 }}>Start Date</span>
            <input 
              type="date" 
              value={start} 
              onChange={e => setStart(e.target.value)}
              style={{ padding: 8, fontSize: "1em" }}
            />
          </label>
          <label style={{ flex: 1, display: "grid", gap: 4 }}>
            <span style={{ fontWeight: 500 }}>End Date</span>
            <input 
              type="date" 
              value={end} 
              onChange={e => setEnd(e.target.value)}
              style={{ padding: 8, fontSize: "1em" }}
            />
          </label>
        </div>
        
        <button type="submit" disabled={loading} style={{ padding: "12px 24px", fontSize: "1em", marginTop: 8 }}>
          {loading ? "Computing... (this may take 10-30 seconds)" : "Compute Metrics"}
        </button>
      </form>

      {loading && (
        <div style={{ marginTop: 24, padding: 16, backgroundColor: "#f0f0f0", borderRadius: 8, color: "#333" }}>
          <p style={{ margin: 0 }}>⏳ Fetching market data...</p>
          <p style={{ margin: "8px 0 0 0", fontSize: "0.9em", color: "#666" }}>
            This can take 10-30 seconds due to API rate limits. Please wait.
          </p>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 24, padding: 16, backgroundColor: "#fee", border: "1px solid #fcc", borderRadius: 8 }}>
          <p style={{ color: "#c00", margin: 0, fontWeight: 500 }}>Error:</p>
          <p style={{ color: "#c00", margin: "8px 0 0 0" }}>{error}</p>
        </div>
      )}

      {metrics && (
        <div style={{ marginTop: 24, padding: 16, backgroundColor: "#f9f9f9", borderRadius: 8, color: "#333" }}>
          <h2 style={{ marginTop: 0 }}>Portfolio Metrics</h2>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ padding: 12, backgroundColor: "white", borderRadius: 4 }}>
              <strong>Annual Return:</strong> {(metrics.annual_return * 100).toFixed(2)}%
            </div>
            <div style={{ padding: 12, backgroundColor: "white", borderRadius: 4 }}>
              <strong>Annual Volatility:</strong> {(metrics.annual_vol * 100).toFixed(2)}%
            </div>
            <div style={{ padding: 12, backgroundColor: "white", borderRadius: 4 }}>
              <strong>Sharpe Ratio:</strong> {Number.isFinite(metrics.sharpe) ? metrics.sharpe.toFixed(2) : "N/A"}
            </div>
            <div style={{ padding: 12, backgroundColor: "white", borderRadius: 4 }}>
              <strong>Max Drawdown:</strong> {(metrics.max_drawdown * 100).toFixed(2)}%
            </div>
          </div>
          
          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 500, padding: 8 }}>
              View Correlation Matrix
            </summary>
            <pre style={{ 
              backgroundColor: "white", 
              padding: 12, 
              borderRadius: 4, 
              overflow: "auto",
              fontSize: "0.85em"
            }}>
              {JSON.stringify(metrics.correlation, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}