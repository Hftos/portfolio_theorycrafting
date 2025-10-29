import { type CSSProperties } from "react";

interface HeaderProps {
  onThemeToggle?: () => void;
  currentTheme?: "light" | "dark";
}

export default function Header({ onThemeToggle, currentTheme = "light" }: HeaderProps) {
  return (
    <header style={headerStyle}>
      <div style={containerStyle}>
        <div style={brandStyle}>
          {/* Logo wordmark - will use images/logo-wordmark.svg when available */}
          <img
            src="/logo-wordmark.svg"
            alt="Portfolio TheoryCrafter"
            style={logoStyle}
            onError={(e) => {
              // Fallback to text if logo not found
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.removeAttribute("style");
            }}
          />
          <h1 style={{ ...fallbackTextStyle, display: "none" }}>
            Portfolio <span style={{ fontFamily: "var(--font-serif)" }}>Theory</span>Crafter
          </h1>
        </div>

        {onThemeToggle && (
          <button
            onClick={onThemeToggle}
            style={themeToggleStyle}
            aria-label={`Switch to ${currentTheme === "light" ? "dark" : "light"} mode`}
            className="secondary"
          >
            {currentTheme === "light" ? "🌙" : "☀️"}
          </button>
        )}
      </div>
    </header>
  );
}

const headerStyle: CSSProperties = {
  background: "var(--bg-elevated)",
  borderBottom: "1px solid var(--border-subtle)",
  padding: "var(--space-lg) 0",
  marginBottom: "var(--space-xl)",
};

const containerStyle: CSSProperties = {
  maxWidth: "1400px",
  margin: "0 auto",
  padding: "0 var(--space-lg)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const brandStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
};

const logoStyle: CSSProperties = {
  height: "32px",
  width: "auto",
};

const fallbackTextStyle: CSSProperties = {
  fontSize: "var(--text-3xl)",
  fontWeight: 600,
  margin: 0,
  color: "var(--text-primary)",
};

const themeToggleStyle: CSSProperties = {
  width: "40px",
  height: "40px",
  padding: "8px",
  borderRadius: "var(--radius-md)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
};