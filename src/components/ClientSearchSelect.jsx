import { useState, useRef, useEffect } from 'react'

// Searchable client picker. Type to filter by name / address / contact; click or
// Enter to select. Falls back to alphabetical order when the query is empty.
export default function ClientSearchSelect({ clients, value, onChange, placeholder = 'Search by name or address…' }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [hi, setHi] = useState(0)
  const boxRef = useRef(null)
  const inputRef = useRef(null)

  const selected = clients.find((c) => c.id === value)
  const sorted = [...clients].sort((a, b) => a.name.localeCompare(b.name))
  const filtered = q.trim()
    ? sorted.filter((c) => `${c.name} ${c.address || ''} ${c.contact || ''}`.toLowerCase().includes(q.toLowerCase()))
    : sorted

  useEffect(() => {
    const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) { setOpen(false); setQ('') } }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const openIt = () => { setOpen(true); setQ(''); setHi(0); setTimeout(() => inputRef.current?.focus(), 0) }
  const pick = (c) => { onChange(c.id); setOpen(false); setQ('') }

  function onKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[hi]) pick(filtered[hi]) }
    else if (e.key === 'Escape') { setOpen(false); setQ('') }
  }

  return (
    <div className="combo" ref={boxRef}>
      {open ? (
        <input ref={inputRef} className="combo-input" value={q} placeholder={placeholder}
          onChange={(e) => { setQ(e.target.value); setHi(0) }} onKeyDown={onKey} />
      ) : (
        <button type="button" className="combo-field" onClick={openIt}>
          <span style={selected ? undefined : { color: 'var(--muted)' }}>{selected ? selected.name : placeholder}</span>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--muted)', flexShrink: 0 }}><path d="M6 9l6 6 6-6" /></svg>
        </button>
      )}
      {open && (
        <div className="combo-list">
          {filtered.length === 0 && <div className="combo-empty">No matches</div>}
          {filtered.map((c, i) => (
            <button type="button" key={c.id} className={`combo-item${i === hi ? ' hi' : ''}${c.id === value ? ' sel' : ''}`}
              onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setHi(i)} onClick={() => pick(c)}>
              <div className="combo-name">{c.name}</div>
              {c.address && <div className="combo-sub">{c.address}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
