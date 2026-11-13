import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { theme, tickStyle } from '../../lib/chartTheme'
import { dollars, dollarsCompact } from '../../lib/format'
import { LEVELS } from '../../lib/projection'
import type { Band } from '../../types/api'

interface Props {
  bands: Band[]
  color: string
  horizonYears: number
  logScale: boolean
}

// ---------------------------------------------------------------------------
// Tooltip: on hover, list all five levels for that point in time.
// ---------------------------------------------------------------------------
interface TooltipProps {
  active?: boolean
  payload?: { payload: Band & { year: number } }[]
}

function FanTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const band = payload[0].payload
  return (
    <div className="chart-tooltip">
      <div className="muted">After {band.year.toFixed(1)} years</div>
      <table>
        <tbody>
          {LEVELS.map((level) => (
            <tr key={level.key}>
              <td>{level.name}</td>
              <td className="num">{dollars(band[level.key])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function FanChart({ bands, color, horizonYears, logScale }: Props) {
  // -------------------------------------------------------------------------
  // Shape the data for Recharts. A shaded band is an Area whose value is a
  // [low, high] pair, so each row carries two ranges (5th–95th and 25th–75th)
  // plus the median line, and the time in years for the x-axis.
  // -------------------------------------------------------------------------
  // On a log scale $0 can't be drawn (log of 0 is undefined), so an emptied
  // account is drawn at $1 there; the tooltip still shows the true values.
  const floor = (v: number) => (logScale ? Math.max(v, 1) : v)
  const rows = bands.map((b) => ({
    ...b,
    year: b.month / 12,
    outer: [floor(b.p5), floor(b.p95)],
    inner: [floor(b.p25), floor(b.p75)],
    median: floor(b.p50),
  }))

  // -------------------------------------------------------------------------
  // Axis ticks: whole years on x (every 5 years for long horizons), and round
  // dollar steps on y from $0 to just above the Exceptional line's end.
  // -------------------------------------------------------------------------
  const yearStep = horizonYears <= 10 ? 1 : horizonYears <= 20 ? 2 : 5
  const xTicks: number[] = []
  for (let y = 0; y <= horizonYears; y += yearStep) xTicks.push(y)

  const max = Math.max(...bands.map((b) => b.p95))
  let yDomain: [number, number]
  const yTicks: number[] = []
  if (logScale) {
    // Log scale: ticks at 1-2-5 steps ($1K, $2K, $5K, $10K...) around the data.
    // Over very wide ranges (e.g. an account drawn down to $0), keep only powers of ten.
    const min = Math.max(1, Math.min(...bands.map((b) => b.p5)))
    const wide = Math.log10(max / min) > 3
    const steps: number[] = []
    for (let power = Math.floor(Math.log10(min)) - 1; power <= Math.ceil(Math.log10(max)); power++) {
      for (const m of wide ? [1] : [1, 2, 5]) steps.push(m * 10 ** power)
    }
    const low = steps.filter((t) => t <= min).pop() ?? min
    const high = steps.find((t) => t >= max) ?? max
    yDomain = [low, high]
    yTicks.push(...steps.filter((t) => t >= low && t <= high))
  } else {
    // Linear scale: round steps from $0 to just above the Exceptional line's end.
    const rough = max / 5
    const magnitude = 10 ** Math.floor(Math.log10(rough))
    const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? rough
    const top = Math.ceil(max / step) * step
    yDomain = [0, top]
    for (let t = 0; t <= top + step / 2; t += step) yTicks.push(t)
  }

  // -------------------------------------------------------------------------
  // Draw it: the wide 5th–95th band lightest, the 25th–75th band darker on top,
  // and the median as a solid line through the middle.
  // -------------------------------------------------------------------------
  return (
    <ResponsiveContainer width="100%" height={340}>
      <ComposedChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid stroke={theme.grid} vertical={false} />
        <XAxis
          dataKey="year"
          type="number"
          domain={[0, horizonYears]}
          ticks={xTicks}
          tickFormatter={(y: number) => (y === 0 ? 'Today' : `${y} yr`)}
          tick={tickStyle}
          stroke={theme.axis}
          tickLine={false}
        />
        <YAxis
          scale={logScale ? 'log' : 'linear'}
          domain={yDomain}
          ticks={yTicks}
          interval={0}
          tickFormatter={dollarsCompact}
          tick={tickStyle}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip cursor={{ stroke: theme.axis, strokeWidth: 1 }} content={<FanTooltip />} isAnimationActive={false} />
        <Area dataKey="outer" stroke="none" fill={color} fillOpacity={0.15} isAnimationActive={false} activeDot={false} />
        <Area dataKey="inner" stroke="none" fill={color} fillOpacity={0.3} isAnimationActive={false} activeDot={false} />
        <Line
          dataKey="median"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: color, stroke: theme.surface, strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}