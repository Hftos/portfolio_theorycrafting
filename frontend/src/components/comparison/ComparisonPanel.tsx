import { SERIES_COLORS } from '../../lib/chartTheme'
import { newRowId } from '../../lib/ids'
import type { Preset, Security } from '../../types/api'
import type { Comparison } from '../../types/portfolio'
import { HoldingsList } from '../builder/HoldingsList'

const MAX_COMPARISONS = 5 // plus yours = 6, the backend's limit

interface Props {
  comparisons: Comparison[]
  presets: Preset[]
  securities: Security[]
  onChange: (comparisons: Comparison[]) => void
}

// The lowest color slot not already taken (slot 0 is reserved for your portfolio).
function freeColorSlot(comparisons: Comparison[]): number {
  const used = new Set(comparisons.map((c) => c.colorSlot))
  for (let slot = 1; slot < SERIES_COLORS.length; slot++) {
    if (!used.has(slot)) return slot
  }
  return 1
}

export function ComparisonPanel({ comparisons, presets, securities, onChange }: Props) {
  const full = comparisons.length >= MAX_COMPARISONS

  function togglePreset(preset: Preset) {
    const existing = comparisons.find((c) => c.presetId === preset.id)
    if (existing) {
      onChange(comparisons.filter((c) => c.id !== existing.id))
      return
    }
    onChange([
      ...comparisons,
      {
        id: newRowId(),
        name: preset.name,
        colorSlot: freeColorSlot(comparisons),
        presetId: preset.id,
        description: preset.description,
        holdings: preset.holdings.map((h) => ({ id: newRowId(), ticker: h.ticker, weight: String(h.weight) })),
      },
    ])
  }

  function addCustom() {
    const n = comparisons.filter((c) => c.presetId === null).length + 1
    onChange([
      ...comparisons,
      {
        id: newRowId(),
        name: `Custom ${n}`,
        colorSlot: freeColorSlot(comparisons),
        presetId: null,
        description: '',
        holdings: [{ id: newRowId(), ticker: '', weight: '100' }],
      },
    ])
  }

  function update(id: number, changes: Partial<Comparison>) {
    onChange(comparisons.map((c) => (c.id === id ? { ...c, ...changes } : c)))
  }

  function remove(id: number) {
    onChange(comparisons.filter((c) => c.id !== id))
  }

  return (
    <section className="panel">
      <h2>Compare against</h2>
      <p className="muted">Add well-known portfolios, or build your own, to run alongside yours over the same dates.</p>

      <div className="preset-list">
        {presets.map((p) => {
          const active = comparisons.some((c) => c.presetId === p.id)
          const unavailable = !p.available
          return (
            <button
              key={p.id}
              type="button"
              className={`preset ${active ? 'active' : ''}`}
              aria-pressed={active}
              disabled={unavailable || (full && !active)}
              title={unavailable ? `Load ${p.missing.join(', ')} with the pipeline first` : p.description}
              onClick={() => togglePreset(p)}
            >
              {p.name}
            </button>
          )
        })}
      </div>

      <button type="button" onClick={addCustom} disabled={full}>
        + Custom portfolio
      </button>
      {full && <p className="muted">Up to {MAX_COMPARISONS} comparisons at once.</p>}

      {comparisons.map((c) => (
        <div key={c.id} className="comparison">
          <div className="comparison-header">
            <span className="swatch" style={{ background: SERIES_COLORS[c.colorSlot] }} aria-hidden="true" />
            {c.presetId ? (
              <strong>{c.name}</strong>
            ) : (
              <input
                className="comparison-name"
                value={c.name}
                maxLength={40}
                aria-label="Comparison name"
                onChange={(e) => update(c.id, { name: e.target.value })}
              />
            )}
            <button type="button" className="link" onClick={() => remove(c.id)} aria-label={`Remove ${c.name}`}>
              Remove
            </button>
          </div>

          {c.presetId ? (
            <>
              <p className="muted comparison-description">{c.description}</p>
              <p className="comparison-holdings">
                {c.holdings.map((h) => `${h.ticker} ${h.weight}%`).join(', ')}
              </p>
            </>
          ) : (
            <HoldingsList
              holdings={c.holdings}
              securities={securities}
              onChange={(holdings) => update(c.id, { holdings })}
            />
          )}
        </div>
      ))}
    </section>
  )
}