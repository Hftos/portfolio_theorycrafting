import { useCallback, useRef, useState } from 'react'

import type { CatalogCategory, Security } from '../../types/api'
import { SecurityPicker } from './SecurityPicker'

interface Props {
  value: string // the chosen ticker, or "" if none
  catalog: CatalogCategory[]
  securities: Security[]
  exclude: string[] // tickers already used elsewhere in this portfolio
  onChange: (ticker: string) => void
}

// ---------------------------------------------------------------------------
// The ticker field in a holding row: a button showing the chosen ticker.
// Clicking it opens the column picker; choosing closes it and returns focus here.
// ---------------------------------------------------------------------------
export function SecurityField({ value, catalog, securities, exclude, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const name = securities.find((s) => s.ticker === value)?.name

  // A stable function, so the picker's setup (focus, Escape key) doesn't rerun on every keystroke.
  const close = useCallback(() => {
    setOpen(false)
    buttonRef.current?.focus() // put keyboard focus back where the user was
  }, [])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`security-field ${value ? '' : 'empty'}`}
        title={name ?? undefined}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {value || 'Choose…'}
      </button>
      {open && (
        <SecurityPicker
          catalog={catalog}
          securities={securities}
          exclude={exclude}
          onSelect={onChange}
          onClose={close}
        />
      )}
    </>
  )
}