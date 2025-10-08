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
  const [start, setStart] = useState("2018-01-01");
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
      setError(err.message || "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>Portfolio Theorycrafting (MVP)</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label>
          Tickers (comma-separated)
          <input value={tickersText} onChange={e => setTickersText(e.target.value)} />
        </label>
        <label>
          Weights (comma-separated, same length)
          <input value={weightsText} onChange={e => setWeightsText(e.target.value)} />
        </label>
        <div style={{ display: "flex", gap: 12 }}>
          <label style={{ flex: 1 }}>
            Start
            <input type="date" value={start} onChange={e => setStart(e.target.value)} />
          </label>
          <label style={{ flex: 1 }}>
            End
            <input type="date" value={end} onChange={e => setEnd(e.target.value)} />
          </label>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Computing..." : "Compute Metrics"}
        </button>
      </form>

      {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}

      {metrics && (
        <div style={{ marginTop: 24 }}>
          <h2>Results</h2>
          <ul>
            <li>Annual Return: {(metrics.annual_return * 100).toFixed(2)}%</li>
            <li>Annual Volatility: {(metrics.annual_vol * 100).toFixed(2)}%</li>
            <li>Sharpe: {Number.isFinite(metrics.sharpe) ? metrics.sharpe.toFixed(2) : "NaN"}</li>
            <li>Max Drawdown: {(metrics.max_drawdown * 100).toFixed(2)}%</li>
          </ul>
          <details>
            <summary>Correlation matrix (raw)</summary>
            <pre>{JSON.stringify(metrics.correlation, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
