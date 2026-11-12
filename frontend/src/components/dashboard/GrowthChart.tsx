import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { theme, tickStyle } from '../../lib/chartTheme'
import { dollars, dollarsCompact, year } from '../../lib/format'
import { allValues, seriesKey, type ChartRow } from '../../lib/series'
import type { SeriesMeta } from '../../types/portfolio'
import { ChartLegend } from './ChartLegend'
import { ChartTooltip } from './ChartTooltip'

// Log-scale ticks at 1-2-5 steps ($5K, $10K, $20K, $50K...).
// The axis runs from the round value just below the data to the one just above it.
function logTicks(values: number[]): { domain: [number, number]; ticks: number[] } {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const steps: number[] = []
  for (let power = Math.floor(Math.log10(min)) - 1; power <= Math.ceil(Math.log10(max)); power++) {
    for (const m of [1, 2, 5]) steps.push(m * 10 ** power)
  }
  const low = steps.filter((t) => t <= min).pop() ?? min
  const high = steps.find((t) => t >= max) ?? max
  return { domain: [low, high], ticks: steps.filter((t) => t >= low && t <= high) }
}

// Linear ticks on round steps ($5K, $10K, $20K, $25K...) from $0 to just above the data.
function linearTicks(values: number[]): { domain: [number, number]; ticks: number[] } {
  const max = Math.max(...values)
  const rough = max / 5
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? rough
  const top = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let t = 0; t <= top + step / 2; t += step) ticks.push(t)
  return { domain: [0, top], ticks }
}

interface Props {
  rows: ChartRow[]
  series: SeriesMeta[]
}

export function GrowthChart({ rows, series }: Props) {
  // Log scale shows equal % moves as equal heights, so early years aren't flattened.
  const [logScale, setLogScale] = useState(false)
  const values = allValues(rows, series.length)
  const axis = logScale ? logTicks(values) : linearTicks(values)

  // Draw comparisons first and yours last, so your line sits on top.
  const drawOrder = series.map((_, i) => i).reverse()

  return (
    <section className="panel">
      <div className="chart-header">
        <h2>Growth of $10,000</h2>
        <label className="toggle">
          <input type="checkbox" checked={logScale} onChange={(e) => setLogScale(e.target.checked)} />
          Log scale
        </label>
      </div>
      <ChartLegend series={series} />

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid stroke={theme.grid} vertical={false} />
          <XAxis dataKey="date" tickFormatter={year} minTickGap={40} tick={tickStyle} stroke={theme.axis} tickLine={false} />
          <YAxis
            scale={logScale ? 'log' : 'linear'}
            // Linear starts at $0 so heights are honest; log can't include 0.
            domain={axis.domain}
            ticks={axis.ticks}
            interval={0}
            tickFormatter={dollarsCompact}
            tick={tickStyle}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            cursor={{ stroke: theme.axis, strokeWidth: 1 }}
            content={<ChartTooltip series={series} format={dollars} />}
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