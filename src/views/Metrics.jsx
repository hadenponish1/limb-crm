import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'
import { Kpi } from '../components/ui'
import RevenueCalendar from '../components/RevenueCalendar'
import DayPanel from '../components/DayPanel'
import { money } from '../lib/format'
import { monthlyRecurring, projectRevenue, counts, byService, revenueTimeline } from '../lib/metrics'

const PIE = ['#6B7F65', '#c99a4b']

export default function Metrics({ clients, jobs }) {
  const [dayPanel, setDayPanel] = useState(null)
  const byId = Object.fromEntries(clients.map((x) => [x.id, x]))
  const c = counts(clients)
  const mrr = monthlyRecurring(clients)
  const { activeProjects, pipeline } = projectRevenue(clients, 6)
  const { series, ytd, projectedNext } = revenueTimeline(jobs, clients, 3)
  const svc = byService(clients)
  const totalLines = c.recurring + c.project
  const mix = [
    { name: 'Recurring', value: c.recurring },
    { name: 'Project', value: c.project },
  ]
  const recurringRatio = totalLines ? Math.round((c.recurring / totalLines) * 100) : 0
  // the current month is the last non-projected bar
  const pastBars = series.filter((s) => s.projected === 0)
  const currentActual = pastBars.length ? pastBars[pastBars.length - 1].actual : 0

  return (
    <div className="stack">
      <div className="grid kpi-grid">
        <Kpi label="Revenue YTD" value={money(ytd)} icon="dollar" meta={<span style={{ color: 'var(--muted)' }}>actual, this calendar year</span>} />
        <Kpi label="This month (actual)" value={money(currentActual)} icon="calendar" meta={<span style={{ color: 'var(--muted)' }}>booked so far</span>} />
        <Kpi label="Monthly recurring (MRR)" value={money(mrr)} icon="repeat" meta={<span style={{ color: 'var(--muted)' }}>≈ {money(mrr * 12)}/yr · {c.recurringClients} on maintenance</span>} />
        <Kpi label="Projected (next 3 mo)" value={money(projectedNext)} icon="trend" meta={<span style={{ color: 'var(--muted)' }}>recurring + projects + pipeline</span>} />
      </div>

      <div className="card card-pad">
        <div className="card-head">
          <div>
            <div className="card-title">Revenue — actual & projected</div>
            <div className="page-sub">Booked revenue from your job history, with a forecast for upcoming months</div>
          </div>
          <div className="legend">
            <span><i style={{ background: '#6B7F65' }} />Actual (booked)</span>
            <span><i style={{ background: '#A8B89A' }} />Projected</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={series} margin={{ left: -8, right: 8, top: 6 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee6d6" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6c7568' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#6c7568' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v, n) => [money(v), n === 'actual' ? 'Actual' : 'Projected']} contentStyle={{ borderRadius: 12, border: '1px solid #e4e0d3', fontSize: 13 }} cursor={{ fill: '#f4efe3' }} />
            <Bar dataKey="actual" stackId="a" fill="#6B7F65" name="actual" radius={[6, 6, 0, 0]} maxBarSize={54} />
            <Bar dataKey="projected" stackId="a" fill="#A8B89A" name="projected" radius={[6, 6, 0, 0]} maxBarSize={54} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <div className="card-head" style={{ marginBottom: 12 }}>
          <div>
            <div className="card-title">Revenue calendar</div>
            <div className="page-sub">$ earned per day · weekly totals on the right · click a day for its jobs</div>
          </div>
        </div>
        <RevenueCalendar jobs={jobs} onDayClick={setDayPanel} />
      </div>

      <div className="grid two-col">
        <div className="card card-pad">
          <div className="card-head"><div className="card-title">Monthly revenue by service line</div></div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={svc} layout="vertical" margin={{ left: 40, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee6d6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#6c7568' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#20261e' }} axisLine={false} tickLine={false} width={120} />
              <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e4e0d3', fontSize: 13 }} cursor={{ fill: '#f4efe3' }} />
              <Bar dataKey="value" fill="#6B7F65" radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card card-pad">
          <div className="card-head">
            <div className="card-title">Recurring vs project</div>
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{recurringRatio}% recurring · {c.recurring}:{c.project} lines</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={mix} dataKey="value" nameKey="name" innerRadius={62} outerRadius={100} paddingAngle={3}>
                {mix.map((e, i) => <Cell key={i} fill={PIE[i]} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v} service lines`, n]} contentStyle={{ borderRadius: 12, border: '1px solid #e4e0d3', fontSize: 13 }} />
              <Legend iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid kpi-grid">
        <Kpi label="Won project value" value={money(activeProjects)} icon="briefcase" meta={<span style={{ color: 'var(--muted)' }}>booked, in progress</span>} />
        <Kpi label="Weighted pipeline" value={money(pipeline)} icon="trend" meta={<span style={{ color: 'var(--muted)' }}>open quotes @ 40%</span>} />
        <Kpi label="Active clients" value={c.active} icon="users" meta={<span style={{ color: 'var(--muted)' }}>{c.leads} open leads</span>} />
        <Kpi label="Total accounts" value={c.total} icon="dashboard" meta={<span style={{ color: 'var(--muted)' }}>clients + leads</span>} />
      </div>

      {dayPanel && <DayPanel date={dayPanel} jobs={jobs} byId={byId} onClose={() => setDayPanel(null)} />}
    </div>
  )
}
