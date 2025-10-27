import { useState } from "react";
import type { PortfolioHolding, RebalanceFreq } from "../types/api";
import { normalizeWeights, calculateWeightDrift, PRESET_PORTFOLIOS } from "../state/portfolio";

interface Props {
  holdings: PortfolioHolding[];
  rebalance: RebalanceFreq;
  onHoldingsChange: (holdings: PortfolioHolding[]) => void;
  onRebalanceChange: (freq: RebalanceFreq) => void;
}

export default function AllocControls({
  holdings,
  rebalance,
  onHoldingsChange,
  onRebalanceChange,
}: Props) {
  const [showAssumptions, setShowAssumptions] = useState(false);
  const drift = calculateWeightDrift(holdings);

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

  return (
    <div style={{ padding: "20px", background: "#f5f5f5", borderRadius: "8px" }}>
      <h2>Portfolio Allocation</h2>

      {/* Preset Buttons */}
      <div style={{ marginBottom: "20px" }}>
        <strong>Presets:</strong>{" "}
        {Object.keys(PRESET_PORTFOLIOS).map((preset) => (
          <button
            key={preset}
            onClick={() => applyPreset(preset)}
            style={{ marginLeft: "8px", padding: "4px 12px" }}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Holdings List */}
      <div>
        {holdings.map((holding, index) => (
          <div
            key={index}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 2fr 1fr 1fr",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <input
              type="text"
              placeholder="Ticker"
              value={holding.ticker}
              onChange={(e) => updateHolding(index, "ticker", e.target.value.toUpperCase())}
              style={{ padding: "8px" }}
            />
            <select
              value={holding.asset_class}
              onChange={(e) => updateHolding(index, "asset_class", e.target.value)}
              style={{ padding: "8px" }}
            >
              <option value="EQUITY">Equity</option>
              <option value="BOND">Bond</option>
              <option value="ETF">ETF</option>
              <option value="CASH">Cash</option>
            </select>
            <input
              type="number"
              placeholder="Weight %"
              value={holding.weight_pct}
              onChange={(e) => updateHolding(index, "weight_pct", parseFloat(e.target.value) || 0)}
              style={{ padding: "8px" }}
              min="0"
              max="100"
              step="1"
            />
            <button onClick={() => removeHolding(index)} style={{ padding: "8px" }}>
              Remove
            </button>
          </div>
        ))}
      </div>

      <button onClick={addHolding} style={{ marginTop: "8px", padding: "8px 16px" }}>
        + Add Holding
      </button>

      {/* Weight Summary */}
      <div style={{ marginTop: "16px", padding: "12px", background: "#fff", borderRadius: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>
            <strong>Total Weight:</strong> {holdings.reduce((sum, h) => sum + h.weight_pct, 0).toFixed(1)}%
          </span>
          {drift > 0.1 && (
            <button onClick={handleNormalize} style={{ padding: "6px 12px" }}>
              Normalize to 100%
            </button>
          )}
        </div>
        {drift > 0.1 && (
          <div style={{ color: "#ff6b00", marginTop: "4px" }}>
            ⚠️ Weights drift: {drift.toFixed(2)}%
          </div>
        )}
      </div>

      {/* Rebalancing */}
      <div style={{ marginTop: "16px" }}>
        <label>
          <strong>Rebalancing:</strong>{" "}
          <select
            value={rebalance}
            onChange={(e) => onRebalanceChange(e.target.value as RebalanceFreq)}
            style={{ padding: "8px", marginLeft: "8px" }}
          >
            <option value="NONE">None</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="ANNUAL">Annual</option>
          </select>
        </label>
      </div>

      {/* Assumptions Drawer */}
      <div style={{ marginTop: "16px" }}>
        <button onClick={() => setShowAssumptions(!showAssumptions)} style={{ padding: "8px 16px" }}>
          {showAssumptions ? "Hide" : "Show"} Assumptions
        </button>
        {showAssumptions && (
          <div style={{ marginTop: "12px", padding: "12px", background: "#fff", borderRadius: "4px" }}>
            <p><em>Assumptions UI coming soon (expense ratio, slippage, tax mode)</em></p>
          </div>
        )}
      </div>
    </div>
  );
}
