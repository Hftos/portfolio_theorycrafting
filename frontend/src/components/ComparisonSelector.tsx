import { type CSSProperties, useState } from "react";

type ComparisonType = "none" | "sp500" | "threefund" | "custom";

interface ComparisonSelectorProps {
  selectedBenchmarks: string[];
  onBenchmarksChange: (benchmarks: string[]) => void;
}

export default function ComparisonSelector({
  selectedBenchmarks,
  onBenchmarksChange,
}: ComparisonSelectorProps) {
  // Determine current comparison type based on benchmarks
  const getCurrentType = (): ComparisonType => {
    if (selectedBenchmarks.length === 0) return "none";
    if (selectedBenchmarks.length === 1 && selectedBenchmarks[0] === "SPY") return "sp500";
    if (
      selectedBenchmarks.length === 3 &&
      selectedBenchmarks.includes("VTI") &&
      selectedBenchmarks.includes("VXUS") &&
      selectedBenchmarks.includes("BND")
    ) {
      return "threefund";
    }
    return "custom";
  };

  const [comparisonType, setComparisonType] = useState<ComparisonType>(getCurrentType());
  const [customTickers, setCustomTickers] = useState<string>(
    comparisonType === "custom" ? selectedBenchmarks.join(", ") : ""
  );

  const handleTypeChange = (type: ComparisonType) => {
    setComparisonType(type);

    switch (type) {
      case "none":
        onBenchmarksChange([]);
        break;
      case "sp500":
        onBenchmarksChange(["SPY"]);
        break;
      case "threefund":
        onBenchmarksChange(["VTI", "VXUS", "BND"]);
        break;
      case "custom":
        // Don't change benchmarks yet, wait for user input
        break;
    }
  };

  const handleCustomSubmit = () => {
    const tickers = customTickers
      .split(",")
      .map((t) => t.trim().toUpperCase())
      .filter((t) => t.length > 0);

    if (tickers.length > 0) {
      onBenchmarksChange(tickers);
    }
  };

  return (
    <div style={containerStyle}>
      <h3 style={headingStyle}>Add Comparison</h3>

      <div style={optionsGridStyle}>
        {/* None Option */}
        <button
          onClick={() => handleTypeChange("none")}
          style={{
            ...optionButtonStyle,
            ...(comparisonType === "none" ? optionButtonActiveStyle : {}),
          }}
        >
          <div style={optionLabelStyle}>None</div>
          <div style={optionDescStyle}>No benchmark</div>
        </button>

        {/* S&P 500 Option */}
        <button
          onClick={() => handleTypeChange("sp500")}
          style={{
            ...optionButtonStyle,
            ...(comparisonType === "sp500" ? optionButtonActiveStyle : {}),
          }}
        >
          <div style={optionLabelStyle}>S&P 500</div>
          <div style={optionDescStyle}>SPY</div>
        </button>

        {/* Three-Fund Portfolio Option */}
        <button
          onClick={() => handleTypeChange("threefund")}
          style={{
            ...optionButtonStyle,
            ...(comparisonType === "threefund" ? optionButtonActiveStyle : {}),
          }}
        >
          <div style={optionLabelStyle}>Three-Fund</div>
          <div style={optionDescStyle}>VTI, VXUS, BND</div>
        </button>

        {/* Custom Option */}
        <button
          onClick={() => handleTypeChange("custom")}
          style={{
            ...optionButtonStyle,
            ...(comparisonType === "custom" ? optionButtonActiveStyle : {}),
          }}
        >
          <div style={optionLabelStyle}>Custom</div>
          <div style={optionDescStyle}>Your picks</div>
        </button>
      </div>

      {/* Custom Input Section */}
      {comparisonType === "custom" && (
        <div style={customInputSectionStyle}>
          <label style={labelStyle}>
            Benchmark Tickers (comma-separated)
          </label>
          <div style={customInputRowStyle}>
            <input
              type="text"
              placeholder="e.g., QQQ, IWM, AGG"
              value={customTickers}
              onChange={(e) => setCustomTickers(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCustomSubmit();
                }
              }}
              style={customInputStyle}
            />
            <button onClick={handleCustomSubmit} style={applyButtonStyle}>
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Active Benchmarks Display */}
      {selectedBenchmarks.length > 0 && (
        <div style={activeBenchmarksStyle}>
          <span style={activeLabelStyle}>Active: </span>
          {selectedBenchmarks.map((ticker, i) => (
            <span key={ticker} style={tickerBadgeStyle}>
              {ticker}
              {i < selectedBenchmarks.length - 1 && ", "}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const containerStyle: CSSProperties = {
  background: "var(--bg-secondary)",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border-subtle)",
  padding: "var(--space-lg)",
  boxShadow: "var(--shadow-sm)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-md)",
};

const headingStyle: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xl)",
  fontWeight: 600,
  color: "var(--text-primary)",
};

const optionsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "var(--space-sm)",
};

const optionButtonStyle: CSSProperties = {
  background: "var(--bg-tertiary)",
  border: "1px solid var(--border-color)",
  borderRadius: "var(--radius-md)",
  padding: "var(--space-md)",
  cursor: "pointer",
  transition: "all var(--transition-fast)",
  textAlign: "left",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-xs)",
};

const optionButtonActiveStyle: CSSProperties = {
  background: "var(--accent-blue)",
  borderColor: "var(--accent-blue)",
  color: "white",
};

const optionLabelStyle: CSSProperties = {
  fontSize: "var(--text-sm)",
  fontWeight: 600,
};

const optionDescStyle: CSSProperties = {
  fontSize: "var(--text-xs)",
  opacity: 0.8,
};

const customInputSectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-xs)",
  marginTop: "var(--space-sm)",
};

const labelStyle: CSSProperties = {
  fontSize: "var(--text-sm)",
  fontWeight: 500,
  color: "var(--text-secondary)",
};

const customInputRowStyle: CSSProperties = {
  display: "flex",
  gap: "var(--space-sm)",
};

const customInputStyle: CSSProperties = {
  flex: 1,
};

const applyButtonStyle: CSSProperties = {
  padding: "0.5rem 1rem",
  minWidth: "80px",
};

const activeBenchmarksStyle: CSSProperties = {
  padding: "var(--space-sm)",
  background: "var(--bg-tertiary)",
  borderRadius: "var(--radius-md)",
  fontSize: "var(--text-sm)",
};

const activeLabelStyle: CSSProperties = {
  fontWeight: 500,
  color: "var(--text-secondary)",
};

const tickerBadgeStyle: CSSProperties = {
  color: "var(--accent-blue)",
  fontWeight: 600,
  fontFamily: "monospace",
};