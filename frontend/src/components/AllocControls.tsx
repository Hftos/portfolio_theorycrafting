import { type CSSProperties } from "react";
import type { PortfolioHolding, RebalanceFreq } from "../types/api";
import { normalizeWeights, calculateWeightDrift, PRESET_PORTFOLIOS } from "../state/portfolio";

interface Props {
  holdings: PortfolioHolding[];
  rebalance: RebalanceFreq;
  onHoldingsChange: (holdings: PortfolioHolding[]) => void;
  onRebalanceChange: (freq: RebalanceFreq) => void;
  onShowAssumptions?: () => void;
}

export default function AllocControls({
  holdings,
  rebalance,
  onHoldingsChange,
  onRebalanceChange,
  onShowAssumptions,
}: Props) {
  const drift = calculateWeightDrift(holdings);
  const totalWeight = holdings.reduce((sum, h) => sum + h.weight_pct, 0);

  const updateHolding = (index: number, field: keyof PortfolioHolding, value: any) => {
    const updated = [...holdings];
    updated[index] = { ...updated[index], [field]: value };
    onHoldingsChange(updated);
  };

  const addHolding = () => {
    onHoldingsChange([...holdings, { ticker: "", asset_class: "ETF", weight_pct: 0 }]);
  };

  const removeHolding = (index: number) => {
    onHoldingsChange(holdings.filter((_, i) => i !== index));
  };

  const applyPreset = (preset: string) => {
    const presetHoldings = PRESET_PORTFOLIOS[preset];
    if (presetHoldings) {
      onHoldingsChange(presetHoldings);
    }
  };

  const handleNormalize = () => {
    onHoldingsChange(normalizeWeights(holdings));
  };

  const handleEqualWeight = () => {
    if (holdings.length === 0) return;
    const equalPct = 100 / holdings.length;
    const updated = holdings.map((h) => ({ ...h, weight_pct: parseFloat(equalPct.toFixed(2)) }));
    onHoldingsChange(updated);
  };

  const handleRandomize = () => {
    if (holdings.length === 0) return;
    const random = holdings.map(() => Math.random());
    const sum = random.reduce((a, b) => a + b, 0);
    const updated = holdings.map((h, i) => ({
      ...h,
      weight_pct: parseFloat(((random[i] / sum) * 100).toFixed(2)),
    }));
    onHoldingsChange(updated);
  };

  const rebalanceOptions: { value: RebalanceFreq; label: string }[] = [
    { value: "NONE", label: "None" },
    { value: "MONTHLY", label: "Monthly" },
    { value: "QUARTERLY", label: "Quarterly" },
    { value: "ANNUAL", label: "Annual" },
  ];

  // Calculate max weight for a slider (100 - sum of all other holdings)
  const getMaxWeight = (currentIndex: number): number => {
    const otherWeights = holdings.reduce((sum, h, i) =>
      i === currentIndex ? sum : sum + h.weight_pct, 0
    );
    return Math.max(0, 100 - otherWeights);
  };

  return (
    <div style={containerStyle}>
      <h3 style={headingStyle}>Portfolio Holdings</h3>

      {/* Quick Actions */}
      <div style={quickActionsStyle}>
        <button onClick={handleEqualWeight} className="secondary" style={quickActionButtonStyle}>
          Equal Weight
        </button>
        <button onClick={handleRandomize} className="secondary" style={quickActionButtonStyle}>
          Randomize
        </button>
      </div>

      {/* Preset Buttons */}
      <div style={presetsStyle}>
        <label style={labelStyle}>Presets:</label>
        <div style={presetButtonsStyle}>
          {Object.keys(PRESET_PORTFOLIOS).map((preset) => (
            <button
              key={preset}
              onClick={() => applyPreset(preset)}
              className="secondary"
              style={presetButtonStyle}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Holdings List */}
      <div style={holdingsListStyle}>
        {holdings.map((holding, index) => {
          const maxWeight = getMaxWeight(index);
          return (
            <div key={index} style={holdingItemStyle}>
              <div style={holdingTopRowStyle}>
                <input
                  type="text"
                  placeholder="TICKER"
                  value={holding.ticker}
                  onChange={(e) => updateHolding(index, "ticker", e.target.value.toUpperCase())}
                  style={tickerInputStyle}
                />
                <select
                  value={holding.asset_class}
                  onChange={(e) => updateHolding(index, "asset_class", e.target.value)}
                  style={assetClassSelectStyle}
                >
                  <option value="EQUITY">Equity</option>
                  <option value="BOND">Bond</option>
                  <option value="ETF">ETF</option>
                  <option value="CASH">Cash</option>
                </select>
                <button
                  onClick={() => removeHolding(index)}
                  className="secondary"
                  style={removeButtonStyle}
                  aria-label="Remove holding"
                >
                  ×
                </button>
              </div>
              <div style={sliderContainerStyle}>
                <input
                  type="range"
                  min="0"
                  max={maxWeight}
                  step="0.5"
                  value={Math.min(holding.weight_pct, maxWeight)}
                  onChange={(e) => updateHolding(index, "weight_pct", parseFloat(e.target.value))}
                  style={sliderStyle}
                  title={`Max: ${maxWeight.toFixed(1)}%`}
                />
                <input
                  type="number"
                  value={holding.weight_pct}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    updateHolding(index, "weight_pct", Math.min(val, maxWeight));
                  }}
                  style={weightInputStyle}
                  min="0"
                  max={maxWeight}
                  step="0.5"
                />
                <span style={percentLabelStyle}>%</span>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={addHolding} style={addButtonStyle}>
        + Add Holding
      </button>

      {/* Weight Summary */}
      <div style={summaryBoxStyle}>
        <div style={progressBarContainerStyle}>
          <div style={progressLabelStyle}>Total Weight</div>
          <div style={progressBarBackgroundStyle}>
            <div
              style={{
                ...progressBarFillStyle,
                width: `${Math.min(totalWeight, 100)}%`,
                background:
                  Math.abs(totalWeight - 100) < 0.5
                    ? "var(--accent-blue)"
                    : totalWeight > 100
                    ? "var(--accent-coral)"
                    : "var(--accent-beige)",
              }}
            />
          </div>
          <div style={progressValueStyle}>{totalWeight.toFixed(1)}%</div>
        </div>
        {drift > 0.5 && (
          <button onClick={handleNormalize} style={normalizeButtonStyle}>
            Normalize to 100%
          </button>
        )}
      </div>

      {/* Rebalancing */}
      <div style={rebalanceSectionStyle}>
        <label style={labelStyle}>Rebalancing</label>
        <div style={segmentedControlStyle}>
          {rebalanceOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onRebalanceChange(option.value)}
              style={{
                ...segmentButtonStyle,
                ...(rebalance === option.value ? segmentButtonActiveStyle : {}),
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assumptions Link */}
      {onShowAssumptions && (
        <button onClick={onShowAssumptions} className="secondary" style={assumptionsButtonStyle}>
          Show Assumptions
        </button>
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
  gap: "var(--space-lg)",
};

const headingStyle: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xl)",
  fontWeight: 600,
  color: "var(--text-primary)",
};

const quickActionsStyle: CSSProperties = {
  display: "flex",
  gap: "var(--space-sm)",
};

const quickActionButtonStyle: CSSProperties = {
  flex: 1,
};

const presetsStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-sm)",
};

const labelStyle: CSSProperties = {
  fontSize: "var(--text-sm)",
  fontWeight: 500,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const presetButtonsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-sm)",
};

const presetButtonStyle: CSSProperties = {
  padding: "6px 12px",
  fontSize: "var(--text-xs)",
};

const holdingsListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-md)",
};

const holdingItemStyle: CSSProperties = {
  padding: "var(--space-md)",
  background: "var(--bg-tertiary)",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border-subtle)",
};

const holdingTopRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 1.5fr auto",
  gap: "var(--space-sm)",
  marginBottom: "var(--space-sm)",
};

const tickerInputStyle: CSSProperties = {
  fontWeight: 600,
  textTransform: "uppercase",
};

const assetClassSelectStyle: CSSProperties = {};

const removeButtonStyle: CSSProperties = {
  width: "32px",
  padding: "4px",
  fontSize: "20px",
  lineHeight: "1",
};

const sliderContainerStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto auto",
  gap: "var(--space-sm)",
  alignItems: "center",
};

const sliderStyle: CSSProperties = {
  WebkitAppearance: "none",
  appearance: "none",
  width: "100%",
  height: "6px",
  borderRadius: "3px",
  background: "var(--border-color)",
  outline: "none",
};

const weightInputStyle: CSSProperties = {
  width: "60px",
  textAlign: "right",
};

const percentLabelStyle: CSSProperties = {
  fontSize: "var(--text-sm)",
  color: "var(--text-secondary)",
};

const addButtonStyle: CSSProperties = {
  width: "100%",
};

const summaryBoxStyle: CSSProperties = {
  padding: "var(--space-md)",
  background: "var(--bg-tertiary)",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border-subtle)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-sm)",
};

const progressBarContainerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-xs)",
};

const progressLabelStyle: CSSProperties = {
  fontSize: "var(--text-xs)",
  fontWeight: 500,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const progressBarBackgroundStyle: CSSProperties = {
  width: "100%",
  height: "8px",
  background: "var(--bg-primary)",
  borderRadius: "4px",
  overflow: "hidden",
};

const progressBarFillStyle: CSSProperties = {
  height: "100%",
  transition: "all var(--transition-base)",
  borderRadius: "4px",
};

const progressValueStyle: CSSProperties = {
  fontSize: "var(--text-sm)",
  fontWeight: 600,
  color: "var(--text-primary)",
};

const normalizeButtonStyle: CSSProperties = {
  alignSelf: "flex-start",
  padding: "6px 12px",
  fontSize: "var(--text-xs)",
};

const rebalanceSectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-sm)",
};

const segmentedControlStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "2px",
  background: "var(--border-color)",
  borderRadius: "var(--radius-md)",
  padding: "2px",
};

const segmentButtonStyle: CSSProperties = {
  background: "var(--bg-secondary)",
  border: "none",
  padding: "8px",
  fontSize: "var(--text-xs)",
  fontWeight: 500,
  color: "var(--text-secondary)",
  borderRadius: "calc(var(--radius-md) - 2px)",
  cursor: "pointer",
  transition: "all var(--transition-fast)",
};

const segmentButtonActiveStyle: CSSProperties = {
  background: "var(--accent-blue)",
  color: "white",
};

const assumptionsButtonStyle: CSSProperties = {
  width: "100%",
};
