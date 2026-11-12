import { longDate } from '../../lib/format'
import type { SeriesMeta } from '../../types/portfolio'

// Recharts passes `active` and `payload` to a custom tooltip when you hover the chart.
interface Props {
  active?: boolean
  payload?: { dataKey: string; value: number; payload: { date: string } }[]
  series: SeriesMeta[]
  format: (value: number) => string
}

export function ChartTooltip({ active, payload, series, format }: Props) {
  if (!active || !payload || payload.length === 0) return null

  // Show portfolios in their usual order (yours first), whatever order they were drawn in.
  const byIndex = [...payload].sort((a, b) => a.dataKey.localeCompare(b.dataKey, undefined, { numeric: true }))

  return (
    <div className="chart-tooltip">
      <div className="muted">{longDate(payload[0].payload.date)}</div>
      <table>
        <tbody>
          {byIndex.map((item) => {
            const meta = series[Number(item.dataKey.slice(1))]
            return (
              <tr key={item.dataKey}>
                <td>
                  <span className="swatch" style={{ background: meta.color }} aria-hidden="true" /> {meta.name}
                </td>
                <td className="num">{format(item.value)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}