import { useState } from "react";
import { runSimulation } from "./lib/api";
import { createDefaultSimRequest } from "./state/portfolio";
import type { SimRequest, SimResponse, PortfolioHolding, RebalanceFreq } from "./types/api";
import AllocControls from "./components/AllocControls";
import SummaryTiles from "./components/SummaryTiles";
import PerformanceChart from "./components/PerformanceChart";
import DrawdownChart from "./components/DrawdownChart";
import CorrelationMatrix from "./components/CorrelationMatrix";
import RiskContribution from "./components/RiskContribution";
import "./App.css";

function App() {
  const [request, setRequest] = useState<SimRequest>(createDefaultSimRequest());
  const [response, setResponse] = useState<SimResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunSimulation = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await runSimulation(request);
      setResponse(result);
    } catch (err: any) {
      setError(err.message || "Failed to run simulation");
      console.error("Simulation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateHoldings = (holdings: PortfolioHolding[]) => {
    setRequest({ ...request, holdings });
  };

  const updateRebalance = (rebalance: RebalanceFreq) => {
    setRequest({ ...request, rebalance });
  };

  const toggleLogScale = (logScale: boolean) => {
    setRequest({ ...request, log_scale: logScale });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", padding: "20px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <header style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#1f2937" }}>
            Portfolio Theorycrafting
          </h1>
          <p style={{ color: "#6b7280" }}>
            Advanced portfolio simulation with rebalancing, fees, and comprehensive risk metrics
          </p>
        </header>

        {/* Main Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "20px" }}>
          {/* Left Sidebar: Controls */}
          <div>
            <AllocControls
              holdings={request.holdings}
              rebalance={request.rebalance}
              onHoldingsChange={updateHoldings}
              onRebalanceChange={updateRebalance}
            />

            {/* Date Range */}
            <div style={{ marginTop: "20px", padding: "20px", background: "#f5f5f5", borderRadius: "8px" }}>
              <h3>Date Range</h3>
              <div style={{ marginTop: "12px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Start:
                  <input
                    type="date"
                    value={request.start}
                    onChange={(e) => setRequest({ ...request, start: e.target.value })}
                    style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
                  />
                </label>
                <label style={{ display: "block", marginTop: "12px" }}>
                  End:
                  <input
                    type="date"
                    value={request.end}
                    onChange={(e) => setRequest({ ...request, end: e.target.value })}
                    style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
                  />
                </label>
              </div>

              {/* Options */}
              <div style={{ marginTop: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  <input
                    type="checkbox"
                    checked={request.use_dividends}
                    onChange={(e) => setRequest({ ...request, use_dividends: e.target.checked })}
                  />{" "}
                  Include Dividends
                </label>
                <label style={{ display: "block" }}>
                  <input
                    type="checkbox"
                    checked={request.inflation_adjust}
                    onChange={(e) => setRequest({ ...request, inflation_adjust: e.target.checked })}
                  />{" "}
                  Inflation Adjust
                </label>
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={handleRunSimulation}
              disabled={loading || request.holdings.length === 0}
              style={{
                marginTop: "20px",
                width: "100%",
                padding: "16px",
                fontSize: "16px",
                fontWeight: "bold",
                background: loading ? "#9ca3af" : "#8b5cf6",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Running Simulation..." : "Run Simulation"}
            </button>

            {error && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  background: "#fee2e2",
                  color: "#991b1b",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              >
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>

          {/* Right Main Content */}
          <div>
            <SummaryTiles summary={response?.summary || null} loading={loading} />

            {response && (
              <>
                <PerformanceChart
                  portfolio={response.portfolio}
                  benchmarks={response.benchmarks}
                  logScale={request.log_scale}
                  onLogScaleChange={toggleLogScale}
                />

                <DrawdownChart drawdownSeries={response.diagnostics.drawdown_series} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
                  <CorrelationMatrix correlationMatrix={response.diagnostics.correlation_matrix} />
                  <RiskContribution riskContribution={response.diagnostics.risk_contribution} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
