import { Icon } from './icons'
import { colorFor, initials } from '../lib/format'

export function Kpi({ label, value, meta, metaClass, icon }) {
  const I = Icon[icon]
  return (
    <div className="card kpi">
      {I && <div className="kpi-icon"><I /></div>}
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {meta && <div className={`kpi-meta ${metaClass || ''}`}>{meta}</div>}
    </div>
  )
}

export function TypeBadge({ type }) {
  return type === 'recurring' ? (
    <span className="badge recurring"><Icon.repeat style={{ width: 12, height: 12 }} /> Recurring</span>
  ) : (
    <span className="badge project"><Icon.briefcase style={{ width: 12, height: 12 }} /> Project</span>
  )
}

export function StatusBadge({ status }) {
  return <span className={`badge dot ${status}`}>{status === 'lead' ? 'Lead' : 'Active'}</span>
}

export function StageBadge({ stage }) {
  return stage === 'won'
    ? <span className="badge active">Won</span>
    : <span className="badge lead">Quoted</span>
}

export function SourceBadge({ source }) {
  if (!source) return null
  const tr = /task/i.test(source)
  return <span className="badge src" style={tr ? { background: '#e7edf6', color: '#3a5f8a' } : undefined}>{source}</span>
}

export function Avatar({ name, service }) {
  return (
    <div className="avatar" style={{ background: colorFor(service || name) }}>
      {initials(name)}
    </div>
  )
}
