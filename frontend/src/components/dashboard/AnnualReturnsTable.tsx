import { returnCellColor, returnTextColor } from '../../lib/chartTheme'
import { signedPct } from '../../lib/format'
import type { PortfolioResult } from '../../types/api'
import type { SeriesMeta } from '../../types/portfolio'

interface Props {
  portfolios: PortfolioResult[]
  series: SeriesMeta[]
}

// One row per calendar year, one column per portfolio; cells shaded green for gains, burgundy for losses.
// A table rather than a bar chart: with several portfolios over 20+ years, bars would be too crowded to read.
export function AnnualReturnsTable({ portfolios, series }: Props) {
  const years = portfolios[0].annual_returns
  const newestFirst = [...years].reverse()

  return (
    <section className="panel">
      <h2>Calendar-year returns</h2>
      <p className="muted">
        Each year's gain or loss, January to December. Partial years, where the data starts or ends mid-year, are
        marked and left out of best and worst year.
      </p>

      <div className="table-scroll year-scroll">
        <table className="years">
          <thead>
            <tr>
              <th scope="col">Year</th>
              {portfolios.map((p, i) => (
                <th key={p.name} scope="col">
                  <span className="swatch" style={{ background: series[i].color }} aria-hidden="true" /> {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {newestFirst.map((y) => {
              const index = years.indexOf(y)
              return (
                <tr key={y.year} className={y.partial ? 'partial' : ''}>
                  <th scope="row">
                    {y.year}
                    {y.partial && <span className="muted"> (partial)</span>}
                  </th>
                  {portfolios.map((p) => {
                    const value = p.annual_returns[index].value
                    return (
                      <td
                        key={p.name}
                        style={{ background: returnCellColor(value), color: returnTextColor(value) }}
                      >
                        {signedPct(value)}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
