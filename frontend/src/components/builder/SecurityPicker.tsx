import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import type { CatalogCategory, CatalogSecurity, Security } from '../../types/api'
import { InfoTip } from '../common/InfoTip'

interface Props {
  catalog: CatalogCategory[]
  securities: Security[] // everything loaded, including tickers outside the catalog
  exclude: string[] // tickers already used elsewhere in this portfolio
  onSelect: (ticker: string) => void
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Search: does a security match what the user typed?
// Matches the ticker, the name, or the description, so "gold", "japan" or
// "inflation" all find something, not just exact tickers.
// ---------------------------------------------------------------------------
function matches(query: string, s: { ticker: string; name: string | null; description?: string }): boolean {
  const q = query.trim().toLowerCase()
  if (q === '') return true
  return (
    s.ticker.toLowerCase().includes(q) ||
    (s.name ?? '').toLowerCase().includes(q) ||
    (s.description ?? '').toLowerCase().includes(q)
  )
}

// ---------------------------------------------------------------------------
// The picker: a large panel over the page, with a search box on top and one
// column per kind of asset. On narrow screens the columns become tabs.
// ---------------------------------------------------------------------------
export function SecurityPicker({ catalog, securities, exclude, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState(catalog[0]?.id ?? '') // used on narrow screens only
  const searchRef = useRef<HTMLInputElement>(null)
  const titleId = useId()

  // -------------------------------------------------------------------------
  // While open: focus the search box, close on Escape, and stop the page
  // behind from scrolling. Everything is undone when the picker closes.
  // -------------------------------------------------------------------------
  useEffect(() => {
    searchRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  // -------------------------------------------------------------------------
  // Filter every column by the search, keeping only groups with a match.
  // Also find loaded securities outside the catalog that match the search,
  // so a typed ticker like "BRK" still turns up if it's in the database.
  // -------------------------------------------------------------------------
  const filtered = useMemo(
    () =>
      catalog.map((category) => ({
        ...category,
        groups: category.groups
          .map((g) => ({ ...g, securities: g.securities.filter((s) => matches(query, s)) }))
          .filter((g) => g.securities.length > 0),
      })),
    [catalog, query],
  )

  const inCatalog = useMemo(
    () => new Set(catalog.flatMap((c) => c.groups.flatMap((g) => g.securities.map((s) => s.ticker)))),
    [catalog],
  )
  const others = query.trim()
    ? securities.filter((s) => !inCatalog.has(s.ticker) && matches(query, s)).slice(0, 12)
    : []
  const totalMatches = filtered.reduce((n, c) => n + c.groups.reduce((m, g) => m + g.securities.length, 0), 0)

  // -------------------------------------------------------------------------
  // One selectable row. Unloaded or already-added securities are shown but can't be picked,
  // and say why.
  // -------------------------------------------------------------------------
  function renderItem(s: CatalogSecurity) {
    const used = exclude.includes(s.ticker)
    const disabled = used || !s.available
    const status = used ? 'Already added' : !s.available ? 'Not loaded yet' : `Since ${s.first_date?.slice(0, 4)}`
    return (
      <li key={s.ticker}>
        <button
          type="button"
          className="picker-item"
          disabled={disabled}
          onClick={() => {
            onSelect(s.ticker)
            onClose()
          }}
        >
          <span className="picker-item-top">
            <span className="picker-ticker">{s.ticker}</span>
            <span className="picker-status">{status}</span>
          </span>
          <span className="picker-description">{s.description}</span>
        </button>
      </li>
    )
  }

  return createPortal(
    // Clicking the dimmed area outside the panel closes it.
    <div className="picker-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="picker" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        {/* --------------------------------------------------------------
            Header: title, search box, close button.
            -------------------------------------------------------------- */}
        <div className="picker-header">
          <h2 id={titleId}>Choose a security</h2>
          <input
            ref={searchRef}
            type="search"
            className="picker-search"
            placeholder="Search by ticker, name or theme: try “gold”, “japan” or “inflation”"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search securities"
          />
          <button type="button" className="link picker-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* --------------------------------------------------------------
            Tabs: only visible on narrow screens, where the columns don't fit side by side.
            -------------------------------------------------------------- */}
        <div className="picker-tabs" role="tablist" aria-label="Kinds of asset">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={activeTab === c.id}
              onClick={() => setActiveTab(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* --------------------------------------------------------------
            The columns: one per kind of asset, each with its groups.
            -------------------------------------------------------------- */}
        <div className="picker-columns">
          {filtered.map((category) => (
            <section
              key={category.id}
              className={`picker-column ${activeTab === category.id ? 'active' : ''}`}
              aria-label={category.label}
            >
              <h3>
                {category.label} <InfoTip title={category.label} body={[category.description]} />
              </h3>
              {category.groups.length === 0 && <p className="muted picker-empty">No matches</p>}
              {category.groups.map((group) => (
                <div key={group.name} className="picker-group">
                  <h4>{group.name}</h4>
                  <ul>{group.securities.map(renderItem)}</ul>
                </div>
              ))}
            </section>
          ))}
        </div>

        {/* --------------------------------------------------------------
            Footer: loaded securities outside the catalog that match the search.
            -------------------------------------------------------------- */}
        {others.length > 0 && (
          <div className="picker-others">
            <h4>Also in your database</h4>
            <div className="picker-others-list">
              {others.map((s) => (
                <button
                  key={s.ticker}
                  type="button"
                  disabled={exclude.includes(s.ticker)}
                  onClick={() => {
                    onSelect(s.ticker)
                    onClose()
                  }}
                >
                  <strong>{s.ticker}</strong> {s.name ?? ''}
                </button>
              ))}
            </div>
          </div>
        )}
        {query.trim() && totalMatches === 0 && others.length === 0 && (
          <p className="picker-none">
            Nothing matches “{query}”. Securities outside the catalog can be loaded with the pipeline.
          </p>
        )}
      </div>
    </div>,
    document.body,
  )
}