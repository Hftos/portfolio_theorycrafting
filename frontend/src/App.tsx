import { useState, useEffect, type CSSProperties } from "react";
import { runSimulation } from "./lib/api";
import { createDefaultSimRequest } from "./state/portfolio";
import type { SimRequest, SimResponse, PortfolioHolding, RebalanceFreq } from "./types/api";
import Header from "./components/Header";
import AllocControls from "./components/AllocControls";
import ComparisonSelector from "./components/ComparisonSelector";
import SummaryTiles from "./components/SummaryTiles";
import PerformanceChart from "./components/PerformanceChart";
import DrawdownChart from "./components/DrawdownChart";
import CorrelationMatrix from "./components/CorrelationMatrix";
import RiskContribution from "./components/RiskContribution";
import EmptyState from "./components/EmptyState";
import ErrorToast from "./components/ErrorToast";
import AssumptionsModal from "./components/AssumptionsModal";
import "./App.css";

function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [request, setRequest] = useState<SimRequest>(createDefaultSimRequest());
  const [response, setResponse] = useState<SimResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAssumptionsModal, setShowAssumptionsModal] = useState(false);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

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

  const updateBenchmarks = (benchmarks: string[]) => {
    setRequest({ ...request, benchmarks });
  };

  const toggleLogScale = (logScale: boolean) => {
    setRequest({ ...request, log_scale: logScale });
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const hasResults = response !== null;
  const hasHoldings = request.holdings.length > 0;

  return (
    <div style={appContainerStyle}>
      <Header onThemeToggle={toggleTheme} currentTheme={theme} />

      <main style={mainStyle}>
        <div style={containerStyle}>
          {/* 12-Column Grid Layout */}
          <div style={gridContainerStyle}>
            {/* Left Column: Controls (3 cols) */}
            <aside style={controlsColumnStyle}>
              <AllocControls
                holdings={request.holdings}
                rebalance={request.rebalance}
                onHoldingsChange={updateHoldings}
                onRebalanceChange={updateRebalance}
                onShowAssumptions={() => setShowAssumptionsModal(true)}
              />

              {/* Date Range & Options */}
              <div style={dateRangeCardStyle}>
                <h3 style={cardHeadingStyle}>Date Range & Options</h3>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Start Date</label>
                  <input
                    type="date"
                    value={request.start}
                    onChange={(e) => setRequest({ ...request, start: e.target.value })}
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>End Date</label>
                  <input
                    type="date"
                    value={request.end}
                    onChange={(e) => setRequest({ ...request, end: e.target.value })}
                  />
                </div>
                <div style={checkboxGroupStyle}>
                  <label style={checkboxLabelStyle}>
                    <input
                      type="checkbox"
                      checked={request.use_dividends}
                      onChange={(e) => setRequest({ ...request, use_dividends: e.target.checked })}
                    />
                    <span>Include Dividends</span>
                  </label>
                  <label style={checkboxLabelStyle}>
                    <input
                      type="checkbox"
                      checked={request.inflation_adjust}
                      onChange={(e) => setRequest({ ...request, inflation_adjust: e.target.checked })}
                    />
                    <span>Inflation Adjust</span>
                  </label>
                </div>
              </div>

              {/* Comparison Selector */}
              <ComparisonSelector
                selectedBenchmarks={request.benchmarks}
                onBenchmarksChange={updateBenchmarks}
              />

              {/* Run Button */}
              <button
                onClick={handleRunSimulation}
                disabled={loading || !hasHoldings}
                style={runButtonStyle}
              >
                {loading ? "Running Simulation..." : "Run Simulation"}
              </button>
            </aside>

            {/* Center Column: Performance Chart (6 cols) */}
            <section style={centerColumnStyle}>
              {!hasResults && !loading && (
                <EmptyState
                  title="Welcome to Portfolio TheoryCrafter"
                  message="Add holdings in the controls panel and run a simulation to start analyzing your portfolio."
                />
              )}

              {hasResults && (
                <PerformanceChart
                  portfolio={response.portfolio}
                  benchmarks={response.benchmarks}
                  logScale={request.log_scale}
                  onLogScaleChange={toggleLogScale}
                />
              )}

              {hasResults && (
                <div style={secondaryChartsStyle}>
                  <DrawdownChart drawdownSeries={response.diagnostics.drawdown_series} />
                </div>
              )}
            </section>

            {/* Right Column: Metrics (3 cols) */}
            <aside style={metricsColumnStyle}>
              <SummaryTiles summary={response?.summary || null} loading={loading} />
            </aside>
          </div>

          {/* Additional Diagnostics: Full Width */}
          {hasResults && (
            <div style={diagnosticsGridStyle}>
              <CorrelationMatrix correlationMatrix={response.diagnostics.correlation_matrix} />
              <RiskContribution riskContribution={response.diagnostics.risk_contribution} />
            </div>
          )}
        </div>
      </main>

      {/* Error Toast */}
      {error && <ErrorToast message={error} onClose={() => setError(null)} />}

      {/* Assumptions Modal */}
      {showAssumptionsModal && (
        <AssumptionsModal
          assumptions={request.assumptions}
          startDate={request.start}
          endDate={request.end}
          onClose={() => setShowAssumptionsModal(false)}
        />
      )}
    </div>
  );
}

export default App;

// Styles
const appContainerStyle: CSSProperties = {
  minHeight: "100vh",
  background: "var(--bg-primary)",
};

const mainStyle: CSSProperties = {
  paddingBottom: "var(--space-2xl)",
};

const containerStyle: CSSProperties = {
  maxWidth: "1400px",
  margin: "0 auto",
  padding: "0 var(--space-lg)",
};

const gridContainerStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(12, 1fr)",
  gap: "var(--space-lg)",
  marginBottom: "var(--space-xl)",
};

const controlsColumnStyle: CSSProperties = {
  gridColumn: "span 3",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-lg)",
};

const centerColumnStyle: CSSProperties = {
  gridColumn: "span 6",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-lg)",
};

const metricsColumnStyle: CSSProperties = {
  gridColumn: "span 3",
};

const dateRangeCardStyle: CSSProperties = {
  background: "var(--bg-secondary)",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border-subtle)",
  padding: "var(--space-lg)",
  boxShadow: "var(--shadow-sm)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-md)",
};

const cardHeadingStyle: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xl)",
  fontWeight: 600,
  color: "var(--text-primary)",
};

const formGroupStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-xs)",
};

const labelStyle: CSSProperties = {
  fontSize: "var(--text-sm)",
  fontWeight: 500,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const checkboxGroupStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-sm)",
};

const checkboxLabelStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "var(--text-sm)",
  cursor: "pointer",
  userSelect: "none",
};

const runButtonStyle: CSSProperties = {
  width: "100%",
  padding: "var(--space-md)",
  fontSize: "var(--text-base)",
  fontWeight: 600,
};

const secondaryChartsStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-lg)",
};

const diagnosticsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "var(--space-lg)",
  marginTop: "var(--space-xl)",
};

// Media Queries (mobile-first stacking)
// Note: CSS-in-JS doesn't support media queries directly,
// but the grid will naturally stack on small screens
