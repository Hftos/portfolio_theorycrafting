import { type CSSProperties, useState } from "react";
import type { Assumptions } from "../types/api";

interface AssumptionsModalProps {
  assumptions: Assumptions;
  startDate: string;
  endDate: string;
  onClose: () => void;
}

type Tab = "data" | "returns" | "risk" | "costs";

export default function AssumptionsModal({
  assumptions,
  startDate,
  endDate,
  onClose,
}: AssumptionsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("data");

  const handleCopyJSON = () => {
    const data = {
      assumptions,
      dateRange: { start: startDate, end: endDate },
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert("Copied assumptions to clipboard!");
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "data", label: "Data" },
    { id: "returns", label: "Returns" },
    { id: "risk", label: "Risk" },
    { id: "costs", label: "Costs" },
  ];

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Simulation Assumptions</h2>
          <button
            onClick={onClose}
            style={closeButtonStyle}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div style={tabsContainerStyle}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...tabButtonStyle,
                ...(activeTab === tab.id ? tabButtonActiveStyle : {}),
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={contentStyle}>
          {activeTab === "data" && (
            <dl style={definitionListStyle}>
              <dt style={dtStyle}>Start Date</dt>
              <dd style={ddStyle}>{startDate}</dd>

              <dt style={dtStyle}>End Date</dt>
              <dd style={ddStyle}>{endDate}</dd>

              <dt style={dtStyle}>Data Source</dt>
              <dd style={ddStyle}>Yahoo Finance (yfinance)</dd>

              <dt style={dtStyle}>Trading Days per Year</dt>
              <dd style={ddStyle}>252</dd>
            </dl>
          )}

          {activeTab === "returns" && (
            <dl style={definitionListStyle}>
              <dt style={dtStyle}>Risk-Free Rate</dt>
              <dd style={ddStyle}>{(assumptions.rf_rate * 100).toFixed(2)}%</dd>

              <dt style={dtStyle}>Return Calculation</dt>
              <dd style={ddStyle}>Geometric (CAGR)</dd>

              <dt style={dtStyle}>Annualization Method</dt>
              <dd style={ddStyle}>252 trading days</dd>
            </dl>
          )}

          {activeTab === "risk" && (
            <dl style={definitionListStyle}>
              <dt style={dtStyle}>Volatility Calculation</dt>
              <dd style={ddStyle}>Annualized Standard Deviation</dd>

              <dt style={dtStyle}>VaR Confidence Levels</dt>
              <dd style={ddStyle}>95% (5th percentile), 99% (1st percentile)</dd>

              <dt style={dtStyle}>Sharpe Ratio</dt>
              <dd style={ddStyle}>(Return - Risk Free) / Volatility</dd>

              <dt style={dtStyle}>Sortino Ratio</dt>
              <dd style={ddStyle}>Uses downside deviation only</dd>
            </dl>
          )}

          {activeTab === "costs" && (
            <dl style={definitionListStyle}>
              <dt style={dtStyle}>Expense Ratio</dt>
              <dd style={ddStyle}>{assumptions.expense_ratio_bps} bps</dd>

              <dt style={dtStyle}>Slippage</dt>
              <dd style={ddStyle}>{assumptions.slippage_bps} bps per trade</dd>

              <dt style={dtStyle}>Tax Mode</dt>
              <dd style={ddStyle}>{assumptions.tax_mode.replace("_", " ")}</dd>

              <dt style={dtStyle}>Short-Term Tax Rate</dt>
              <dd style={ddStyle}>{(assumptions.short_term_rate * 100).toFixed(1)}%</dd>

              <dt style={dtStyle}>Long-Term Tax Rate</dt>
              <dd style={ddStyle}>{(assumptions.long_term_rate * 100).toFixed(1)}%</dd>
            </dl>
          )}
        </div>

        <div style={footerStyle}>
          <button onClick={handleCopyJSON} className="secondary" style={copyButtonStyle}>
            📋 Copy as JSON
          </button>
          <button onClick={onClose} style={closeFooterButtonStyle}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: "var(--space-lg)",
};

const modalStyle: CSSProperties = {
  background: "var(--bg-elevated)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--shadow-lg)",
  maxWidth: "600px",
  width: "100%",
  maxHeight: "80vh",
  display: "flex",
  flexDirection: "column",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "var(--space-lg)",
  borderBottom: "1px solid var(--border-subtle)",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-2xl)",
  fontWeight: 600,
  color: "var(--text-primary)",
};

const closeButtonStyle: CSSProperties = {
  background: "transparent",
  border: "none",
  fontSize: "32px",
  lineHeight: "1",
  cursor: "pointer",
  color: "var(--text-secondary)",
  padding: "0",
  width: "32px",
  height: "32px",
};

const tabsContainerStyle: CSSProperties = {
  display: "flex",
  borderBottom: "1px solid var(--border-subtle)",
  padding: "0 var(--space-lg)",
};

const tabButtonStyle: CSSProperties = {
  background: "transparent",
  border: "none",
  padding: "var(--space-md) var(--space-lg)",
  fontSize: "var(--text-sm)",
  fontWeight: 500,
  color: "var(--text-secondary)",
  cursor: "pointer",
  borderBottom: "2px solid transparent",
  transition: "all var(--transition-fast)",
};

const tabButtonActiveStyle: CSSProperties = {
  color: "var(--accent-blue)",
  borderBottomColor: "var(--accent-blue)",
};

const contentStyle: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "var(--space-lg)",
};

const definitionListStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "var(--space-md)",
  margin: 0,
};

const dtStyle: CSSProperties = {
  fontSize: "var(--text-sm)",
  fontWeight: 500,
  color: "var(--text-secondary)",
  margin: 0,
};

const ddStyle: CSSProperties = {
  fontSize: "var(--text-sm)",
  color: "var(--text-primary)",
  margin: 0,
  fontWeight: 600,
};

const footerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "var(--space-sm)",
  padding: "var(--space-lg)",
  borderTop: "1px solid var(--border-subtle)",
};

const copyButtonStyle: CSSProperties = {};

const closeFooterButtonStyle: CSSProperties = {};