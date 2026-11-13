import { useEffect, useRef, useState } from 'react'

import { runProjection } from '../../api/client'
import { dollars, longDate, pct } from '../../lib/format'
import { LEVELS, MODELS, RETURN_ASSUMPTIONS } from '../../lib/projection'
import type { CompareRequest, ProjectionModel, ProjectResponse } from '../../types/api'
import type { SeriesMeta } from '../../types/portfolio'
import { ErrorMessage } from '../common/ErrorMessage'
import { FanChart } from './FanChart'

interface Props {
  baseRequest: CompareRequest // the portfolios and settings from the last run
  series: SeriesMeta[]
}

const UPDATE_DELAY_MS = 350 // wait this long after the last change before recalculating

export function ProjectionPanel({ baseRequest, series }: Props) {
  // -------------------------------------------------------------------------
  // Projection settings, chosen in this panel.
  // -------------------------------------------------------------------------
  const [model, setModel] = useState<ProjectionModel>('bootstrap')
  const [horizon, setHorizon] = useState(20)
  const [contribution, setContribution] = useState('0') // text while typing, like the weights
  const [adjustment, setAdjustment] = useState(0)
  const [selected, setSelected] = useState(0) // which portfolio the fan chart shows
  const [logScale, setLogScale] = useState(false)

  // -------------------------------------------------------------------------
  // The latest result, and whether a calculation is running.
  // -------------------------------------------------------------------------
  const [result, setResult] = useState<ProjectResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const latestCall = useRef(0) // numbers each request, so a slow, outdated answer is ignored

  const monthly = Number(contribution) || 0

  // -------------------------------------------------------------------------
  // Recalculate automatically whenever a setting (or the base portfolios) changes.
  // The short delay means dragging the horizon slider sends one request at the end,
  // not one for every step. If an older request finishes after a newer one started,
  // its answer is thrown away, so the chart always matches the current settings.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const call = ++latestCall.current
    const timer = setTimeout(() => {
      setLoading(true)
      runProjection({
        ...baseRequest,
        model,
        horizon_years: horizon,
        monthly_contribution: monthly,
        return_adjustment: adjustment,
      })
        .then((response) => {
          if (call !== latestCall.current) return // a newer request is on its way
          setResult(response)
          setError(null)
        })
        .catch((e: Error) => {
          if (call === latestCall.current) setError(e.message)
        })
        .finally(() => {
          if (call === latestCall.current) setLoading(false)
        })
    }, UPDATE_DELAY_MS)
    return () => clearTimeout(timer) // a new change cancels the pending request
  }, [baseRequest, model, horizon, monthly, adjustment])

  // -------------------------------------------------------------------------
  // Pick out the portfolio the fan chart is showing, and its final-year levels.
  // -------------------------------------------------------------------------
  const shown = result && result.portfolios[Math.min(selected, result.portfolios.length - 1)]
  const shownIndex = result ? result.portfolios.indexOf(shown!) : 0
  const final = shown?.bands[shown.bands.length - 1]
  const withdrawing = monthly < 0
  const currentModel = MODELS.find((m) => m.value === model)!

  return (
    <section className={`panel projection ${loading ? 'updating' : ''}`}>
      <h2>Where it could go from here</h2>
      <p className="muted">
        {result ? result.paths.toLocaleString() : '5,000'} simulated futures, learned from this portfolio's own history
        {result && ` (${longDate(result.history_start)} to ${longDate(result.history_end)})`}. These are ranges of
        possibilities, not predictions.
      </p>

      {/* ------------------------------------------------------------------
          Controls: model, horizon, contributions, and the return assumption.
          ------------------------------------------------------------------ */}
      <div className="projection-controls">
        <div className="control">
          <span className="control-label">Model</span>
          <div className="segmented" role="group" aria-label="Projection model">
            {MODELS.map((m) => (
              <button key={m.value} type="button" aria-pressed={model === m.value} onClick={() => setModel(m.value)}>
                {m.label}
              </button>
            ))}
          </div>
          <p className="control-hint">{currentModel.description}</p>
        </div>

        <label className="control">
          <span className="control-label">
            Horizon: {horizon} {horizon === 1 ? 'year' : 'years'}
          </span>
          <input type="range" min={1} max={40} value={horizon} onChange={(e) => setHorizon(Number(e.target.value))} />
        </label>

        <label className="control">
          <span className="control-label">Monthly contribution ($)</span>
          <input type="number" step={50} value={contribution} onChange={(e) => setContribution(e.target.value)} />
          <span className="control-hint">Use a negative number for withdrawals.</span>
        </label>

        <label className="control">
          <span className="control-label">Future returns</span>
          <select value={adjustment} onChange={(e) => setAdjustment(Number(e.target.value))}>
            {RETURN_ASSUMPTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
          <span className="control-hint">History may be kinder than the future. Test a tougher assumption.</span>
        </label>
      </div>

      {error && <ErrorMessage message={error} />}

      {result && shown && final && (
        <>
          {/* --------------------------------------------------------------
              Which portfolio to chart (only shown when comparing).
              -------------------------------------------------------------- */}
          <div className="chart-header portfolio-switch">
            {result.portfolios.length > 1 ? (
              <div className="segmented" role="group" aria-label="Portfolio shown in the chart">
                {result.portfolios.map((p, i) => (
                  <button key={p.name} type="button" aria-pressed={i === shownIndex} onClick={() => setSelected(i)}>
                    <span className="swatch" style={{ background: series[i].color }} aria-hidden="true" /> {p.name}
                  </button>
                ))}
              </div>
            ) : (
              <span />
            )}
            {/* Long horizons stretch the best case far above the rest; log scale keeps every band readable. */}
            <label className="toggle">
              <input type="checkbox" checked={logScale} onChange={(e) => setLogScale(e.target.checked)} />
              Log scale
            </label>
          </div>

          {/* --------------------------------------------------------------
              The fan chart, with the five levels after N years beside it.
              -------------------------------------------------------------- */}
          <div className="fan-layout">
            <FanChart
              bands={shown.bands}
              color={series[shownIndex].color}
              horizonYears={result.horizon_years}
              logScale={logScale}
            />
            <div className="levels">
              <p className="levels-title">
                After {result.horizon_years} {result.horizon_years === 1 ? 'year' : 'years'}
              </p>
              <dl>
                {LEVELS.map((level) => (
                  <div key={level.key} className={`level level-${level.key}`}>
                    <dt>{level.name}</dt>
                    <dd className="level-value">{dollars(final[level.key])}</dd>
                    <dd className="level-note">{level.note}</dd>
                  </div>
                ))}
              </dl>
              {/* With withdrawals, "total put in" would go negative, so describe the two flows separately. */}
              <p className="muted level-invested">
                {withdrawing
                  ? `Started with ${dollars(baseRequest.start_value ?? 10_000)}, withdrew ${dollars(-monthly * result.horizon_years * 12)} in total`
                  : `Total put in: ${dollars(result.total_invested)}`}
              </p>
            </div>
          </div>

          {/* --------------------------------------------------------------
              Every portfolio's outlook side by side, on the same simulated futures.
              -------------------------------------------------------------- */}
          <div className="table-scroll">
            <table className="stats projection-table">
              <thead>
                <tr>
                  <th>Portfolio</th>
                  <th>Poor</th>
                  <th>Expected</th>
                  <th>Exceptional</th>
                  {withdrawing ? <th>Chance of running out</th> : <th>Chance of a loss</th>}
                  {!withdrawing && <th>Chance of doubling</th>}
                </tr>
              </thead>
              <tbody>
                {result.portfolios.map((p, i) => (
                  <tr key={p.name} className={i === 0 ? 'yours-row' : ''}>
                    <td>
                      <span className="swatch" style={{ background: series[i].color }} aria-hidden="true" /> {p.name}
                    </td>
                    <td>{dollars(p.summary.p5_final)}</td>
                    <td>{dollars(p.summary.median_final)}</td>
                    <td>{dollars(p.summary.p95_final)}</td>
                    {withdrawing ? (
                      <td>{pct(p.summary.chance_of_running_out, 0)}</td>
                    ) : (
                      <td>{pct(p.summary.chance_of_loss, 0)}</td>
                    )}
                    {!withdrawing && <td>{pct(p.summary.chance_of_doubling, 0)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.portfolios.length > 1 && (
            <p className="muted">
              Every portfolio faces the same simulated futures, so differences come from the portfolios, not from luck.
            </p>
          )}
        </>
      )}
    </section>
  )
}