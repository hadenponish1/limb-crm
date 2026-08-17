import { useState } from 'react'

// Duration input expressed in HOURS while the app stores minutes internally.
// Keeps its own raw string so typing decimals (e.g. "2.5") isn't reformatted
// mid-keystroke; reports minutes back via onMinutes.
export default function HoursField({ minutes, onMinutes, placeholder = 'e.g. 2.5', ...rest }) {
  const [raw, setRaw] = useState(() => (minutes ? String(+(minutes / 60).toFixed(2)) : ''))
  return (
    <input
      type="number" step="0.25" min="0" inputMode="decimal" placeholder={placeholder}
      value={raw}
      onChange={(e) => {
        const v = e.target.value
        setRaw(v)
        if (v === '') { onMinutes(0); return }
        const h = Number(v)
        if (!Number.isNaN(h) && h >= 0) onMinutes(Math.round(h * 60))
      }}
      {...rest}
    />
  )
}
