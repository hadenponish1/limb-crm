import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Kpi } from '../components/ui'
import { Icon } from '../components/icons'
import MonthCalendar from '../components/MonthCalendar'
import { money } from '../lib/format'
import { monthlyRecurring, bookedThisMonth, projectRevenue, counts } from '../lib/metrics'

export default function Dashboard({ clients, jobs, go }) {
  const mrr = monthlyRecurring(clients)
  const booked = bookedThisMonth(jobs)
  const { series } = projectRevenue(clients, 6)
  const c = counts(clients)
  const proj6 = series.reduce((s, m) => s + m.total, 0)

  const byId = Object.fromEntries(clients.map((x) => [x.id, x]))

  return (
    <div className="stack">
      <div className="grid kpi-grid">
        <Kpi label="Booked this month" value={money(booked)} icon="dollar"
          meta={<><Icon.trend style={{ width: 14, height: 14 }} className="up" /> <span className="up">from schedule</span></>} />
        <Kpi label="Monthly recurring (MRR)" value={money(mrr)} icon="repeat"
          meta={<button className="kpi-link" onClick={() => go('metrics', 'maintenance')}>{c.recurringClients} clients on maintenance →</button>} />
        <Kpi label="Projected (6 mo)" value={money(proj6)} icon="trend"
          meta={<span style={{ color: 'var(--muted)' }}>recurring + projects + pipeline</span>} />
        <Kpi label="Active clients" value={c.active} icon="users"
          meta={<span style={{ color: 'var(--muted)' }}>{c.leads} open leads</span>} />
      </div>

      <div className="grid two-col">
        <div className="card card-pad">
          <div className="card-head">
            <div className="card-title">Projected revenue — next 6 months</div>
            <div className="legend">
              <span><i style={{ background: '#6B7F65' }} />Recurring</span>
              <span><i style={{ background: '#c99a4b' }} />Projects</span>
              <span><i style={{ background: '#A8B89A' }} />Pipeline</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={series} margin={{ left: -12, right: 8, top: 6 }}>
              <defs>
                <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6B7F65" stopOpacity={0.7} /><stop offset="100%" stopColor="#6B7F65" stopOpacity={0.05} /></linearGradient>
                <linearGradient id="gProj" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c99a4b" stopOpacity={0.7} /><stop offset="100%" stopColor="#c99a4b" stopOpacity={0.05} /></linearGradient>
                <linearGradient id="gPipe" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#A8B89A" stopOpacity={0.6} /><stop offset="100%" stopColor="#A8B89A" stopOpacity={0.05} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee6d6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6c7568' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6c7568' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v, n) => [money(v), n]} contentStyle={{ borderRadius: 12, border: '1px solid #e4e0d3', fontSize: 13 }} />
              <Area type="monotone" dataKey="recurring" stackId="1" stroke="#6B7F65" strokeWidth={2} fill="url(#gRec)" />
              <Area type="monotone" dataKey="projects" stackId="1" stroke="#c99a4b" strokeWidth={2} fill="url(#gProj)" />
              <Area type="monotone" dataKey="pipeline" stackId="1" stroke="#A8B89A" strokeWidth={2} fill="url(#gPipe)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card card-pad">
          <div className="card-head">
            <div className="card-title">Service mix</div>
          </div>
          <MixBar recurring={c.recurring} project={c.project} />
          <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <MixRow color="#6B7F65" label="Recurring service lines" value={c.recurring} sub={`${c.recurringClients} clients · ${money(mrr)}/mo`} />
            <MixRow color="#c99a4b" label="Project service lines" value={c.project} sub={`${c.projectClients} clients`} />
            <MixRow color="#4d6b7a" label="Open leads" value={c.leads} sub="in pipeline" />
          </div>
        </div>
      </div>

      <div>
        <div className="card-head" style={{ marginBottom: 12 }}>
          <div className="card-title">This week</div>
          <button className="btn btn-ghost btn-sm" onClick={() => go('schedule')}>Open schedule</button>
        </div>
        <MonthCalendar jobs={jobs} byId={byId} initialMode="week" lockMode compact
          onDayClick={() => go('schedule')} onJobClick={() => go('schedule')} />
      </div>
    </div>
  )
}

function MixBar({ recurring, project }) {
  const total = recurring + project || 1
  return (
    <div style={{ display: 'flex', height: 44, borderRadius: 10, overflow: 'hidden', boxShadow: 'inset 0 0 0 1px #e4e0d3' }}>
      <div style={{ width: `${(recurring / total) * 100}%`, background: '#6B7F65', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
        {Math.round((recurring / total) * 100)}%
      </div>
      <div style={{ width: `${(project / total) * 100}%`, background: '#c99a4b', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
        {Math.round((project / total) * 100)}%
      </div>
    </div>
  )
}

function MixRow({ color, label, value, total, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <i style={{ width: 11, height: 11, borderRadius: 3, background: color }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{sub}</div>
      </div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600, color: 'var(--moss)' }}>{value}</div>
    </div>
  )
}
