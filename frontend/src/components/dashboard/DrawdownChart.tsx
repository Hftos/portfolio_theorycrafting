import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { theme, tickStyle } from '../../lib/chartTheme'
import { longDate, pct, year } from '../../lib/format'
import { allValues, seriesKey, type ChartRow } from '../../lib/series'
import type { SeriesMeta } from '../../types/portfolio'
import { ChartLegend } from './ChartLegend'
import { ChartTooltip } from './ChartTooltip'

interface Props {
  rows: ChartRow[]
  series: SeriesMeta[]
}

export function DrawdownChart({ rows, series }: Props) {
  // Your portfolio's worst point, called out in words.
  const yours = seriesKey(0)
  const worst = rows.reduce((min, r) => ((r[yours] as number) < (min[yours] as number) ? r : min), rows[0])

  // Round axis ticks: 0%, -10%, -20%... down past the worst point of any portfolio.
  const lowest = Math.min(...allValues(rows, series.length))
  const step = lowest < -0.4 ? 0.2 : 0.1
  const bottom = Math.floor(lowest / step) * step
  const ticks: number[] = []
  for (let t = 0; t >= bottom - 1e-9; t -= step) ticks.push(Number(t.toFixed(2)))

  const drawOrder = series.map((_, i) => i).reverse() // yours on top

  return (
    <section className="panel">
      <h2>Drawdowns</h2>
      <p className="muted">
        How far below its previous high each portfolio was. Yours bottomed at {pct(worst[yours] as number, 1)} in the
        week of {longDate(worst.date)}.
      </p>
      <ChartLegend series={series} />

      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid stroke={theme.grid} vertical={false} />
          <XAxis dataKey="date" tickFormatter={year} minTickGap={40} tick={tickStyle} stroke={theme.axis} tickLine={false} />
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
            content={<ChartTooltip series={series} format={(v) => pct(v, 1)} />}
            isAnimationActive={false}
          />
          {/* A light wash under your line only; with several lines, more fills would just muddy the chart. */}
          <Area
            type="monotone"
            dataKey={yours}
            stroke="none"
            fill={series[0].color}
            fillOpacity={0.1}
            activeDot={false}
            tooltipType="none"
            isAnimationActive={false}
          />
          {drawOrder.map((i) => (
            <Line
              key={i}
              type="monotone"
              dataKey={seriesKey(i)}
              stroke={series[i].color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: series[i].color, stroke: theme.surface, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </section>
  )
}