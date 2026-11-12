import { dollars, num, pct } from '../../lib/format'
import type { PortfolioResult } from '../../types/api'
import type { SeriesMeta } from '../../types/portfolio'

interface Props {
  portfolios: PortfolioResult[]
  series: SeriesMeta[]
}

// Every portfolio side by side, same dates, same settings.
export function ComparisonTable({ portfolios, series }: Props) {
  if (portfolios.length < 2) return null

  return (
    <section className="panel">
      <h2>Side by side</h2>
      <p className="muted">Every portfolio over the same dates, with the same rebalancing and risk-free rate.</p>

      <table className="stats">
        <thead>
          <tr>
            <th>Portfolio</th>
            <th>$10,000 became</th>
            <th>CAGR</th>
            <th>Volatility</th>
            <th>Sharpe</th>
            <th>Max drawdown</th>
          </tr>
        </thead>
        <tbody>
          {portfolios.map((p, i) => (
            <tr key={p.name} className={i === 0 ? 'yours-row' : ''}>
              <td>
                <span className="swatch" style={{ background: series[i].color }} aria-hidden="true" /> {p.name}
              </td>
              <td>{dollars(p.growth[p.growth.length - 1].value)}</td>
              <td>{pct(p.metrics.cagr)}</td>
              <td>{pct(p.metrics.volatility)}</td>
              <td>{num(p.metrics.sharpe_ratio)}</td>
              <td>{pct(p.metrics.max_drawdown)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}