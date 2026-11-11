import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { theme, tickStyle } from '../../lib/chartTheme'
import { longDate, pct, year } from '../../lib/format'
import type { Point } from '../../types/api'
import { ChartTooltip } from './ChartTooltip'

interface Props {
  data: Point[]
}

export function DrawdownChart({ data }: Props) {
  // Find the worst point so we can call it out in words.
  const worst = data.reduce((min, p) => (p.value < min.value ? p : min), data[0])

  // Round axis ticks: 0%, -10%, -20%... down past the worst point.
  const step = worst.value < -0.4 ? 0.2 : 0.1
  const bottom = Math.floor(worst.value / step) * step
  const ticks: number[] = []
  for (let t = 0; t >= bottom - 1e-9; t -= step) ticks.push(Number(t.toFixed(2)))

  return (
    <section className="panel">
      <h2>Drawdowns</h2>
      <p className="muted">
        How far below its previous high the portfolio was on each day. Worst: {pct(worst.value, 1)} on{' '}
        {longDate(worst.date)}.
      </p>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid stroke={theme.grid} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={year}
            minTickGap={40}
            tick={tickStyle}
            stroke={theme.axis}
            tickLine={false}
          />
          <YAxis
            domain={[bottom, 0]}
            ticks={ticks}
            interval={0}
            tickFormatter={(v: number) => pct(v, 0)}
            tick={tickStyle}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            cursor={{ stroke: theme.axis, strokeWidth: 1 }}
            content={<ChartTooltip format={(v) => pct(v, 1)} valueLabel="Below peak" />}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={theme.series}
            strokeWidth={2}
            fill={theme.series}
            fillOpacity={0.1}
            activeDot={{ r: 4, fill: theme.series, stroke: theme.surface, strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </section>
  )
}