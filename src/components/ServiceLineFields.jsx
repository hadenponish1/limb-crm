import { Icon } from './icons'
import { SERVICES, FREQUENCIES } from '../lib/store'

// Editor for a single service line. `line` is the object; `onChange(next)` patches it.
export default function ServiceLineFields({ line, onChange }) {
  const set = (k, v) => onChange({ ...line, [k]: v })
  return (
    <>
      <div className="field">
        <label>Service</label>
        <select value={line.service} onChange={(e) => set('service', e.target.value)}>
          {SERVICES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Type</label>
        <div className="seg">
          <button type="button" className={line.type === 'recurring' ? 'on' : ''}
            onClick={() => onChange({ ...line, type: 'recurring', frequency: line.frequency || 'weekly' })}>
            <Icon.repeat style={{ width: 14, height: 14, verticalAlign: '-2px', marginRight: 6 }} />Recurring
          </button>
          <button type="button" className={line.type === 'project' ? 'on' : ''}
            onClick={() => onChange({ ...line, type: 'project', stage: line.stage || 'quoted' })}>
            <Icon.briefcase style={{ width: 14, height: 14, verticalAlign: '-2px', marginRight: 6 }} />Project
          </button>
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>{line.type === 'recurring' ? 'Price / visit' : 'Quoted amount'}</label>
          <input type="number" min="0" step="0.01" value={line.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0" />
        </div>
        {line.type === 'recurring' ? (
          <div className="field">
            <label>Frequency</label>
            <select value={line.frequency || 'weekly'} onChange={(e) => set('frequency', e.target.value)}>
              {FREQUENCIES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
        ) : (
          <div className="field">
            <label>Stage</label>
            <select value={line.stage || 'quoted'} onChange={(e) => set('stage', e.target.value)}>
              <option value="quoted">Quoted</option>
              <option value="won">Won</option>
            </select>
          </div>
        )}
      </div>
      {line.type === 'recurring' && (
        <div className="field-row">
          <div className="field"><label>Preferred time</label><input type="time" value={line.time || '08:00'} onChange={(e) => set('time', e.target.value)} /></div>
          <div className="field"><label>Visit length (min)</label><input type="number" value={line.duration || 60} onChange={(e) => set('duration', Number(e.target.value) || 60)} /></div>
        </div>
      )}
    </>
  )
}
