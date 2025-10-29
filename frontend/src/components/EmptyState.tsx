import { type CSSProperties } from "react";

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export default function EmptyState({
  title = "No Data Yet",
  message = "Add holdings and run a simulation to see your portfolio analysis.",
}: EmptyStateProps) {
  return (
    <div style={containerStyle}>
      <div style={iconContainerStyle}>
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          style={iconStyle}
        >
          {/* Simple chart icon */}
          <rect x="12" y="36" width="8" height="16" fill="currentColor" opacity="0.3" rx="2" />
          <rect x="28" y="24" width="8" height="28" fill="currentColor" opacity="0.5" rx="2" />
          <rect x="44" y="16" width="8" height="36" fill="currentColor" opacity="0.7" rx="2" />
        </svg>
      </div>
      <h3 style={titleStyle}>{title}</h3>
      <p style={messageStyle}>{message}</p>
    </div>
  );
}

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "var(--space-2xl)",
  textAlign: "center",
  minHeight: "300px",
  background: "var(--bg-secondary)",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border-subtle)",
};

const iconContainerStyle: CSSProperties = {
  marginBottom: "var(--space-lg)",
  color: "var(--text-tertiary)",
};

const iconStyle: CSSProperties = {
  display: "block",
};

const titleStyle: CSSProperties = {
  fontSize: "var(--text-xl)",
  fontWeight: 600,
  color: "var(--text-primary)",
  marginBottom: "var(--space-sm)",
};

const messageStyle: CSSProperties = {
  fontSize: "var(--text-base)",
  color: "var(--text-secondary)",
  maxWidth: "400px",
};