import { useId, useRef, useState } from 'react'

import type { Security } from '../../types/api'

interface Props {
  value: string // the chosen ticker, or "" if none
  securities: Security[]
  exclude: string[] // tickers already used elsewhere in this portfolio
  onChange: (ticker: string) => void
}

const MAX_RESULTS = 8

// Ticker matches rank first (exact, then starts-with), then name matches.
function search(query: string, securities: Security[]): Security[] {
  const q = query.trim().toUpperCase()
  if (q === '') return securities.slice(0, MAX_RESULTS)
  const score = (s: Security): number => {
    if (s.ticker === q) return 0
    if (s.ticker.startsWith(q)) return 1
    if ((s.name ?? '').toUpperCase().includes(q)) return 2
    return -1
  }
  return securities
    .map((s) => ({ s, rank: score(s) }))
    .filter((x) => x.rank >= 0)
    .sort((a, b) => a.rank - b.rank || a.s.ticker.localeCompare(b.s.ticker))
    .slice(0, MAX_RESULTS)
    .map((x) => x.s)
}

/*
  A search box with a suggestion list (an accessible "combobox"):
  type a ticker or part of a name, then click a result or use the arrow keys and Enter.
*/
export function TickerPicker({ value, securities, exclude, onChange }: Props) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0) // highlighted suggestion
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const results = search(query, securities)

  function choose(s: Security) {
    if (exclude.includes(s.ticker)) return
    onChange(s.ticker)
    setQuery(s.ticker)
    setOpen(false)
  }

  // Leaving the box: accept an exact ticker match, otherwise put back the last valid choice.
  function handleBlur() {
    setOpen(false)
    const exact = securities.find((s) => s.ticker === query.trim().toUpperCase())
    if (exact && !exclude.includes(exact.ticker)) {
      onChange(exact.ticker)
      setQuery(exact.ticker)
    } else {
      setQuery(value)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && open && results[active]) {
      e.preventDefault()
      choose(results[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery(value)
    }
  }

  return (
    <div className="ticker-picker">
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
        aria-label="Ticker"
        placeholder="Search…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setActive(0)
        }}
        onFocus={(e) => {
          e.target.select() // so typing replaces the current ticker
          setOpen(true)
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />

      {open && (
        <ul id={listId} role="listbox" className="ticker-results">
          {results.length === 0 && <li className="ticker-empty">No matches in the database</li>}
          {results.map((s, i) => {
            const used = exclude.includes(s.ticker)
            return (
              <li
                key={s.ticker}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                aria-disabled={used}
                className={`${i === active ? 'active' : ''} ${used ? 'used' : ''}`}
                // onMouseDown, not onClick: it fires before the input's blur closes the list.
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(s)
                }}
                onMouseEnter={() => setActive(i)}
              >
                <span className="ticker-symbol">{s.ticker}</span>
                <span className="ticker-name">{s.name ?? ''}</span>
                <span className="ticker-since">{used ? 'added' : `since ${s.first_date.slice(0, 4)}`}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
