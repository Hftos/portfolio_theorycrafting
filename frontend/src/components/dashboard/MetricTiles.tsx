import { dollars, longDate, num, pct } from '../../lib/format'
import type { BacktestResponse } from '../../types/api'

interface Props {
  result: BacktestResponse
  startValue: number
}

export function MetricTiles({ result, startValue }: Props) {
  const m = result.metrics
  const endValue = result.growth[result.growth.length - 1].value

  // Each tile: the number, plus one plain-English line on what it means.
  const tiles = [
    { label: 'CAGR', value: pct(m.cagr), hint: 'Average yearly growth, compounded' },
    { label: 'Volatility', value: pct(m.volatility), hint: 'How much returns swing, per year' },
    { label: 'Sharpe ratio', value: num(m.sharpe_ratio), hint: 'Return earned per unit of risk' },
    { label: 'Max drawdown', value: pct(m.max_drawdown), hint: 'Worst fall from a peak' },
  ]

  return (
    <section className="panel">
      <p className="hero-label">
        {dollars(startValue)} invested on {longDate(result.start_date)} became
      </p>
      <p className="hero-number">{dollars(endValue)}</p>
      <p className="muted">
        by {longDate(result.end_date)} · total return {pct(m.total_return, 1)}
      </p>

      <div className="tiles">
        {tiles.map((t) => (
          <div key={t.label} className="tile">
            <div className="tile-label">{t.label}</div>
            <div className="tile-value">{t.value}</div>
            <div className="tile-hint">{t.hint}</div>
          </div>
        ))}
      </div>
    </section>
  )
}