import { type CSSProperties, useEffect } from "react";

interface ErrorToastProps {
  message: string;
  onClose?: () => void;
  duration?: number;
}

export default function ErrorToast({
  message,
  onClose,
  duration = 5000,
}: ErrorToastProps) {
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div style={toastStyle} role="alert">
      <div style={contentStyle}>
        <span style={iconStyle}>⚠️</span>
        <p style={messageStyle}>{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={closeButtonStyle}
          aria-label="Close error message"
        >
          ×
        </button>
      )}
    </div>
  );
}

const toastStyle: CSSProperties = {
  position: "fixed",
  top: "var(--space-xl)",
  right: "var(--space-xl)",
  maxWidth: "400px",
  background: "var(--bg-elevated)",
  border: "1px solid var(--accent-coral)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--shadow-lg)",
  padding: "var(--space-md)",
  display: "flex",
  alignItems: "flex-start",
  gap: "var(--space-sm)",
  zIndex: 1000,
  animation: "slideIn 0.3s ease",
};

const contentStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "flex-start",
  gap: "var(--space-sm)",
};

const iconStyle: CSSProperties = {
  fontSize: "20px",
  flexShrink: 0,
};

const messageStyle: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-sm)",
  color: "var(--text-primary)",
  lineHeight: "var(--leading-normal)",
};

const closeButtonStyle: CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--text-secondary)",
  fontSize: "24px",
  lineHeight: "1",
  cursor: "pointer",
  padding: "0",
  width: "24px",
  height: "24px",
  flexShrink: 0,
};