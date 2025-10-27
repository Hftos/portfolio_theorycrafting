interface Props {
  correlationMatrix: Record<string, Record<string, number | null>>;
}

export default function CorrelationMatrix({ correlationMatrix }: Props) {
  if (!correlationMatrix || Object.keys(correlationMatrix).length === 0) {
    return null;
  }

  const tickers = Object.keys(correlationMatrix);

  const getColor = (value: number | null) => {
    if (value === null) return "#e5e7eb";
    const intensity = Math.abs(value);
    if (value > 0) {
      // Positive correlation: blue
      return `rgba(59, 130, 246, ${intensity})`;
    } else {
      // Negative correlation: red
      return `rgba(239, 68, 68, ${intensity})`;
    }
  };

  return (
    <div style={{ padding: "20px", background: "#fff", borderRadius: "8px", marginTop: "20px" }}>
      <h3>Correlation Matrix</h3>
      <div style={{ overflowX: "auto", marginTop: "16px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ padding: "8px", border: "1px solid #ddd", background: "#f5f5f5" }}></th>
              {tickers.map((ticker) => (
                <th
                  key={ticker}
                  style={{
                    padding: "8px",
                    border: "1px solid #ddd",
                    background: "#f5f5f5",
                    fontWeight: "bold",
                  }}
                >
                  {ticker}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickers.map((rowTicker) => (
              <tr key={rowTicker}>
                <td
                  style={{
                    padding: "8px",
                    border: "1px solid #ddd",
                    background: "#f5f5f5",
                    fontWeight: "bold",
                  }}
                >
                  {rowTicker}
                </td>
                {tickers.map((colTicker) => {
                  const value = correlationMatrix[rowTicker]?.[colTicker];
                  return (
                    <td
                      key={colTicker}
                      style={{
                        padding: "8px",
                        border: "1px solid #ddd",
                        background: getColor(value),
                        color: value && Math.abs(value) > 0.5 ? "#fff" : "#000",
                        textAlign: "center",
                        fontWeight: rowTicker === colTicker ? "bold" : "normal",
                      }}
                    >
                      {value !== null ? value.toFixed(2) : "N/A"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: "12px", fontSize: "12px", color: "#666" }}>
        <span style={{ background: "rgba(59, 130, 246, 0.7)", padding: "2px 8px", borderRadius: "3px", color: "#fff", marginRight: "8px" }}>
          Positive
        </span>
        <span style={{ background: "rgba(239, 68, 68, 0.7)", padding: "2px 8px", borderRadius: "3px", color: "#fff" }}>
          Negative
        </span>
      </div>
    </div>
  );
}
