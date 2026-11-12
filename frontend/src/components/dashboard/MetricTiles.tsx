import { dollars, longDate, num, pct } from '../../lib/format'
import type { PortfolioResult } from '../../types/api'

interface Props {
  portfolio: PortfolioResult
  startDate: string
  endDate: string
  startValue: number
}

export function MetricTiles({ portfolio, startDate, endDate, startValue }: Props) {
  const m = portfolio.metrics
  const endValue = portfolio.growth[portfolio.growth.length - 1].value

  // Each figure: the number, plus one plain-English line on what it means.
  const figures = [
    { label: 'Annual growth', value: pct(m.cagr), hint: 'Compound annual growth rate (CAGR)' },
    { label: 'Volatility', value: pct(m.volatility), hint: 'How much returns swing in a year' },
    { label: 'Sharpe ratio', value: num(m.sharpe_ratio), hint: 'Return earned per unit of risk' },
    { label: 'Max drawdown', value: pct(m.max_drawdown), hint: 'Worst fall from a previous high' },
  ]

  return (
    <>
      {/* The headline, set like the face of a certificate */}
      <section className="certificate">
        <p className="certificate-lead">
          {dollars(startValue)} invested on {longDate(startDate)} would have become
        </p>
        <p className="certificate-figure">{dollars(endValue)}</p>
        <p className="certificate-foot">
          by {longDate(endDate)}, a total return of {pct(m.total_return, 1)}
        </p>
      </section>

      <dl className="figures">
        {figures.map((f) => (
          <div key={f.label} className="figure">
            <dt>{f.label}</dt>
            <dd className="figure-value">{f.value}</dd>
            <dd className="figure-hint">{f.hint}</dd>
          </div>
        ))}
      </dl>
    </>
  )
}