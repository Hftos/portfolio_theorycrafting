import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { theme, tickStyle } from '../../lib/chartTheme'
import { pct, signedPct, year } from '../../lib/format'
import { rollingReturns, rollingSummary } from '../../lib/rolling'
import { allValues, seriesKey, type ChartRow } from '../../lib/series'
import type { SeriesMeta } from '../../types/portfolio'
import { ChartLegend } from './ChartLegend'
import { ChartTooltip } from './ChartTooltip'

const WINDOWS = [1, 3, 5, 10]

interface Props {
  growth: ChartRow[] // the same weekly rows the growth chart uses
  series: SeriesMeta[]
}

export function RollingReturnsChart({ growth, series }: Props) {
  // Only offer windows that fit in the data, with at least a year of results to show.
  const spanYears =
    (new Date(growth[growth.length - 1].date).getTime() - new Date(growth[0].date).getTime()) / (365.25 * 86400000)
  const available = WINDOWS.filter((w) => w <= spanYears - 1)
  const [chosen, setChosen] = useState(5)
  const years = available.includes(chosen) ? chosen : available[available.length - 1]

  if (available.length === 0) return null // under two years of data: rolling returns would say little

  const rows = rollingReturns(growth, series.length, years)
  const summary = rollingSummary(rows, 0)

  // Round ticks every 10% (or 20% for wide ranges), always including 0%.
  const values = allValues(rows, series.length)
  const lo = Math.min(0, ...values)
  const hi = Math.max(0, ...values)
  const step = hi - lo > 0.8 ? 0.2 : 0.1
  const bottom = Math.floor(lo / step) * step
  const top = Math.ceil(hi / step) * step
  const ticks: number[] = []
  for (let t = bottom; t <= top + 1e-9; t += step) ticks.push(Number(t.toFixed(2)))

  const drawOrder = series.map((_, i) => i).reverse() // yours on top

  return (
    <section className="panel">
      <div className="chart-header">
        <h2>Rolling {years}-year returns</h2>
        <label className="toggle">
          Window
          <select value={years} onChange={(e) => setChosen(Number(e.target.value))}>
            {available.map((w) => (
              <option key={w} value={w}>
                {w} {w === 1 ? 'year' : 'years'}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="muted">
        Each point is the yearly return of someone who bought {years} {years === 1 ? 'year' : 'years'} earlier and held.
        For your portfolio, the worst {years}-year stretch returned {signedPct(summary.worst)} a year, the median{' '}
        {signedPct(summary.median)}, and the best {signedPct(summary.best)}; {pct(summary.positiveShare, 0)} of
        stretches ended with a gain.
      </p>
      <ChartLegend series={series} />

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid stroke={theme.grid} vertical={false} />
          <XAxis dataKey="date" tickFormatter={year} minTickGap={40} tick={tickStyle} stroke={theme.axis} tickLine={false} />
          <YAxis
            domain={[bottom, top]}
            ticks={ticks}
            interval={0}
            tickFormatter={(v: number) => pct(v, 0)}
            tick={tickStyle}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <ReferenceLine y={0} stroke={theme.axis} />
          <Tooltip
            cursor={{ stroke: theme.axis, strokeWidth: 1 }}
            content={<ChartTooltip series={series} format={(v) => signedPct(v)} />}
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
        </LineChart>
      </ResponsiveContainer>
    </section>
  )
}
