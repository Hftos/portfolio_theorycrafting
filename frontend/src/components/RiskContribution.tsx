import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  riskContribution: Record<string, number | null>;
}

export default function RiskContribution({ riskContribution }: Props) {
  if (!riskContribution || Object.keys(riskContribution).length === 0) {
    return null;
  }

  const chartData = Object.entries(riskContribution).map(([ticker, contrib]) => ({
    ticker,
    contribution: contrib || 0,
  }));

  return (
    <div style={{ padding: "20px", background: "#fff", borderRadius: "8px", marginTop: "20px" }}>
      <h3>Risk Contribution by Asset</h3>
      <p style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>
        Percentage contribution to portfolio variance
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="ticker" />
          <YAxis tickFormatter={(value) => value.toFixed(1) + "%"} />
          <Tooltip formatter={(value: any) => value.toFixed(2) + "%"} />
          <Bar dataKey="contribution" fill="#8b5cf6" name="Risk Contribution" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
