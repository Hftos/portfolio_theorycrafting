import { dollars, duration, num, pct } from '../../lib/format'
import type { GlossaryId } from '../../lib/glossary'
import { Term } from '../common/InfoTip'
import type { Metrics, PortfolioResult } from '../../types/api'
import type { SeriesMeta } from '../../types/portfolio'

interface Props {
  portfolios: PortfolioResult[]
  series: SeriesMeta[]
}

interface Row {
  label: string
  tip: GlossaryId
  value: (m: Metrics, p: PortfolioResult) => string
}

// Statistics down the side, portfolios across the top: this stays readable
// with many statistics, where one column per statistic would run off the page.
const GROUPS: { title: string; rows: Row[] }[] = [
  {
    title: 'Returns',
    rows: [
      { label: '$10,000 became', tip: 'total_return', value: (_, p) => dollars(p.growth[p.growth.length - 1].value) },
      { label: 'Annual growth (CAGR)', tip: 'cagr', value: (m) => pct(m.cagr) },
      { label: 'Best year', tip: 'best_worst_year', value: (m) => pct(m.best_year, 1) },
      { label: 'Worst year', tip: 'best_worst_year', value: (m) => pct(m.worst_year, 1) },
      { label: 'Months with a gain', tip: 'positive_months', value: (m) => pct(m.positive_months, 0) },
    ],
  },
  {
    title: 'Risk',
    rows: [
      { label: 'Volatility', tip: 'volatility', value: (m) => pct(m.volatility) },
      { label: 'Max drawdown', tip: 'max_drawdown', value: (m) => pct(m.max_drawdown) },
      { label: 'Longest time below a high', tip: 'longest_drawdown', value: (m) => duration(m.longest_drawdown_days) },
      { label: 'Below its high today', tip: 'current_drawdown', value: (m) => pct(m.current_drawdown, 1) },
      { label: 'Beta to the S&P 500', tip: 'beta', value: (m) => num(m.beta) },
    ],
  },
  {
    title: 'Risk-adjusted',
    rows: [
      { label: 'Sharpe ratio', tip: 'sharpe', value: (m) => num(m.sharpe_ratio) },
      { label: 'Sortino ratio', tip: 'sortino', value: (m) => num(m.sortino_ratio) },
      { label: 'Calmar ratio', tip: 'calmar', value: (m) => num(m.calmar_ratio) },
    ],
  },
]

export function StatsTable({ portfolios, series }: Props) {
  const comparing = portfolios.length > 1

  return (
    <section className="panel">
      <h2>{comparing ? 'Side by side' : 'Full statistics'}</h2>
      {comparing && (
        <p className="muted">Every portfolio over the same dates, with the same rebalancing and risk-free rate.</p>
      )}

      <div className="table-scroll">
        <table className="stats stats-grid">
          <thead>
            <tr>
              <th></th>
              {portfolios.map((p, i) => (
                <th key={p.name} scope="col">
                  <span className="swatch" style={{ background: series[i].color }} aria-hidden="true" /> {p.name}
                </th>
              ))}
            </tr>
          </thead>
          {GROUPS.map((group) => (
            <tbody key={group.title}>
              <tr className="group-row">
                <th scope="rowgroup" colSpan={portfolios.length + 1}>
                  {group.title}
                </th>
              </tr>
              {group.rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">
                    <Term id={row.tip}>{row.label}</Term>
                  </th>
                  {portfolios.map((p, i) => (
                    <td key={p.name} className={i === 0 ? 'yours-cell' : ''}>
                      {row.value(p.metrics, p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </section>
  )
}