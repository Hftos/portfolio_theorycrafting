import { type CSSProperties } from "react";

interface WelcomeModalProps {
  onClose: () => void;
}

export default function WelcomeModal({ onClose }: WelcomeModalProps) {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Welcome to Portfolio TheoryCrafter</h2>
          <button
            onClick={onClose}
            style={closeButtonStyle}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div style={contentStyle}>
          <p style={introTextStyle}>
            A powerful tool for analyzing portfolio performance using real market data.
          </p>

          <div style={sectionStyle}>
            <h3 style={sectionHeadingStyle}>What You Can Do</h3>
            <ul style={listStyle}>
              <li style={listItemStyle}>
                <strong>Build portfolios</strong> with multiple stocks/ETFs and custom allocations
              </li>
              <li style={listItemStyle}>
                <strong>Run simulations</strong> with historical market data from Yahoo Finance
              </li>
              <li style={listItemStyle}>
                <strong>Analyze performance</strong> with 40+ metrics (CAGR, Sharpe ratio, max drawdown, VaR, etc.)
              </li>
              <li style={listItemStyle}>
                <strong>Compare against benchmarks</strong> like the S&amp;P 500 or custom portfolios
              </li>
              <li style={listItemStyle}>
                <strong>Test rebalancing strategies</strong> (none, monthly, quarterly, annual)
              </li>
              <li style={listItemStyle}>
                <strong>Visualize results</strong> with interactive charts and correlation matrices
              </li>
            </ul>
          </div>

          <div style={sectionStyle}>
            <h3 style={sectionHeadingStyle}>Getting Started</h3>
            <ol style={listStyle}>
              <li style={listItemStyle}>
                Use the <strong>preset buttons</strong> (60/40, All-World, Income) or click <strong>"+ Add Holding"</strong> to build your portfolio
              </li>
              <li style={listItemStyle}>
                Adjust <strong>weights</strong> using sliders (they automatically normalize to 100%)
              </li>
              <li style={listItemStyle}>
                Set your <strong>date range</strong> and configure options
              </li>
              <li style={listItemStyle}>
                Click <strong>"Run Simulation"</strong> and analyze your results
              </li>
            </ol>
          </div>

          <div style={tipBoxStyle}>
            <strong>💡 Pro Tip:</strong> Try the "60/40" preset to see a classic balanced portfolio (60% stocks, 40% bonds) in action.
          </div>
        </div>

        <div style={footerStyle}>
          <button onClick={onClose} style={primaryButtonStyle}>
            Get Started
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
  background: "rgba(0, 0, 0, 0.6)",
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
  maxWidth: "640px",
  width: "100%",
  maxHeight: "85vh",
  display: "flex",
  flexDirection: "column",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "var(--space-xl)",
  borderBottom: "1px solid var(--border-subtle)",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-3xl)",
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
  transition: "color var(--transition-fast)",
};

const contentStyle: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "var(--space-xl)",
};

const introTextStyle: CSSProperties = {
  fontSize: "var(--text-lg)",
  color: "var(--text-secondary)",
  marginTop: 0,
  marginBottom: "var(--space-xl)",
  lineHeight: 1.6,
};

const sectionStyle: CSSProperties = {
  marginBottom: "var(--space-xl)",
};

const sectionHeadingStyle: CSSProperties = {
  fontSize: "var(--text-xl)",
  fontWeight: 600,
  color: "var(--text-primary)",
  marginTop: 0,
  marginBottom: "var(--space-md)",
};

const listStyle: CSSProperties = {
  margin: "0",
  paddingLeft: "var(--space-lg)",
  color: "var(--text-secondary)",
};

const listItemStyle: CSSProperties = {
  fontSize: "var(--text-base)",
  lineHeight: 1.6,
  marginBottom: "var(--space-sm)",
};

const tipBoxStyle: CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--accent-blue)",
  borderRadius: "var(--radius-md)",
  padding: "var(--space-md)",
  fontSize: "var(--text-sm)",
  color: "var(--text-secondary)",
  marginTop: "var(--space-lg)",
};

const footerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  padding: "var(--space-xl)",
  borderTop: "1px solid var(--border-subtle)",
};

const primaryButtonStyle: CSSProperties = {
  background: "var(--accent-blue)",
  color: "white",
  border: "none",
  padding: "var(--space-md) var(--space-2xl)",
  fontSize: "var(--text-base)",
  fontWeight: 600,
  borderRadius: "var(--radius-md)",
  cursor: "pointer",
  transition: "all var(--transition-fast)",
};
