import { type CSSProperties } from "react";

export default function CorrelationGridMotif() {
  return (
    <div style={motifContainerStyle} aria-hidden="true">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 300 300"
        style={svgStyle}
      >
        {/* 3x3 grid of squares with varying opacity */}
        {[0, 1, 2].map((row) =>
          [0, 1, 2].map((col) => {
            const opacity = 0.03 + (Math.sin(row + col) * 0.02);
            const hue = col === row ? 210 : (col > row ? 30 : 40); // Blue diagonal, coral below, beige above

            return (
              <rect
                key={`${row}-${col}`}
                x={col * 100}
                y={row * 100}
                width="98"
                height="98"
                fill={`hsl(${hue}, 50%, 50%)`}
                opacity={opacity}
                rx="4"
              />
            );
          })
        )}
      </svg>
    </div>
  );
}

const motifContainerStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "300px",
  height: "300px",
  pointerEvents: "none",
  zIndex: 0,
};

const svgStyle: CSSProperties = {
  display: "block",
};

// Media query for hiding on mobile - handled in parent component
export const motifMediaQuery = "@media (max-width: 768px)";
