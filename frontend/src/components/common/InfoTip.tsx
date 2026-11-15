import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { GLOSSARY, type GlossaryId } from '../../lib/glossary'

const TIP_WIDTH = 300 // px; keep in sync with .infotip-panel in index.css
const GAP = 6 // px between the button and the explanation

interface Position {
  left: number
  top?: number
  bottom?: number
}

// ---------------------------------------------------------------------------
// A small "?" button that explains a term. It opens on hover, on keyboard
// focus, or on click/tap (which keeps it open until you click elsewhere or
// press Escape), so it works with a mouse, a keyboard and a phone.
// ---------------------------------------------------------------------------
export function InfoTip({ id }: { id: GlossaryId }) {
  const entry = GLOSSARY[id]
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [pinned, setPinned] = useState(false) // opened by a click: stays until dismissed
  const [position, setPosition] = useState<Position>({ left: 0, top: 0 })
  const open = hovered || focused || pinned

  // -------------------------------------------------------------------------
  // Work out where to draw the explanation: just below the button, or above it
  // if there's no room below, and never off the left or right edge of the screen.
  // It's drawn at the top level of the page (a "portal"), so tables that scroll
  // sideways can't cut it off.
  // -------------------------------------------------------------------------
  function place() {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    const left = Math.min(Math.max(8, rect.left - 12), window.innerWidth - TIP_WIDTH - 8)
    const roomBelow = window.innerHeight - rect.bottom
    setPosition(
      roomBelow > 220
        ? { left, top: rect.bottom + GAP }
        : { left, bottom: window.innerHeight - rect.top + GAP },
    )
  }

  // -------------------------------------------------------------------------
  // While open: close on Escape, on scrolling or resizing (the button moves, so
  // the position would go stale), and, for a clicked-open tip, on any click elsewhere.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!open) return
    const close = () => {
      setHovered(false)
      setPinned(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
        setFocused(false)
      }
    }
    const onPointer = (e: MouseEvent) => {
      if (!buttonRef.current?.contains(e.target as Node)) setPinned(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    window.addEventListener('mousedown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      window.removeEventListener('mousedown', onPointer)
    }
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="infotip-button"
        aria-label={`What is ${entry.title}?`}
        aria-expanded={open}
        aria-describedby={open ? panelId : undefined}
        onMouseEnter={() => {
          place()
          setHovered(true)
        }}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => {
          place()
          setFocused(true)
        }}
        onBlur={() => {
          setFocused(false)
          setPinned(false)
        }}
        onClick={(e) => {
          // Inside a <label>, a click would also toggle the label's input (e.g. a checkbox).
          e.preventDefault()
          e.stopPropagation()
          place()
          setPinned((p) => !p)
        }}
      >
        ?
      </button>

      {open &&
        createPortal(
          <div id={panelId} role="tooltip" className="infotip-panel" style={position}>
            <p className="infotip-title">{entry.title}</p>
            {entry.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}

// ---------------------------------------------------------------------------
// A label with its explanation button attached, e.g. <Term id="sharpe">Sharpe ratio</Term>.
// The two stay together on one line so the "?" never wraps away from its word.
// ---------------------------------------------------------------------------
export function Term({ id, children }: { id: GlossaryId; children: ReactNode }) {
  return (
    <span className="term">
      {children}
      <InfoTip id={id} />
    </span>
  )
}