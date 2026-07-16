import { useState } from 'react'
import { FREQ_PRESETS, normFreq } from '../lib/store'

// Pick a recurring cadence: a preset dropdown plus a "Custom → every N weeks/months".
// value can be a legacy string or { every, unit }; onChange always returns { every, unit }.
export default function FrequencyPicker({ value, onChange }) {
  const norm = normFreq(value)
  const matched = FREQ_PRESETS.find((p) => p.every === norm.every && p.unit === norm.unit)
  const [forceCustom, setForceCustom] = useState(false)
  const custom = forceCustom || !matched
  const selKey = custom ? 'custom' : `${norm.every}-${norm.unit}`

  return (
    <>
      <select value={selKey} onChange={(e) => {
        if (e.target.value === 'custom') { setForceCustom(true) }
        else { setForceCustom(false); const [ev, un] = e.target.value.split('-'); onChange({ every: Number(ev), unit: un }) }
      }}>
        {FREQ_PRESETS.map((p) => <option key={`${p.every}-${p.unit}`} value={`${p.every}-${p.unit}`}>{p.label}</option>)}
        <option value="custom">Custom…</option>
      </select>
      {custom && (
        <div className="field-row" style={{ marginTop: 8 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Every</label>
            <input type="number" min="1" value={norm.every} onChange={(e) => onChange({ every: Math.max(1, Number(e.target.value) || 1), unit: norm.unit })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Unit</label>
            <select value={norm.unit} onChange={(e) => onChange({ every: norm.every, unit: e.target.value })}>
              <option value="week">Week(s)</option>
              <option value="month">Month(s)</option>
            </select>
          </div>
        </div>
      )}
    </>
  )
}
