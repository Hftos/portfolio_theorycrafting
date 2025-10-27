import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  drawdownSeries: Array<{ date: string; value: number | null }>;
}

export default function DrawdownChart({ drawdownSeries }: Props) {
  if (!drawdownSeries || drawdownSeries.length === 0) {
    return null;
  }

  const chartData = drawdownSeries.map(point => ({
    date: point.date,
    drawdown: point.value || 0,
  }));

  return (
    <div style={{ padding: "20px", background: "#fff", borderRadius: "8px", marginTop: "20px" }}>
      <h3>Drawdown (Underwater Chart)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
            }}
          />
          <YAxis tickFormatter={(value) => value.toFixed(1) + "%"} />
          <Tooltip
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
            formatter={(value: any) => value.toFixed(2) + "%"}
          />
          <Area
            type="monotone"
            dataKey="drawdown"
            stroke="#ef4444"
            fill="#fecaca"
            name="Drawdown"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
