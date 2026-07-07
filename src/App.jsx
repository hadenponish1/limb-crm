import { useState } from 'react'
import { useStore } from './lib/store'
import { supabase } from './lib/supabase'
import { Icon } from './components/icons'
import LeadModal from './components/LeadModal'
import AutoGeocoder from './components/AutoGeocoder'
import Dashboard from './views/Dashboard'
import Schedule from './views/Schedule'
import Clients from './views/Clients'
import MapView from './views/MapView'
import Metrics from './views/Metrics'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'schedule', label: 'Schedule', icon: 'calendar' },
  { id: 'clients', label: 'Clients & Leads', icon: 'users' },
  { id: 'map', label: 'Map', icon: 'map' },
  { id: 'metrics', label: 'Metrics', icon: 'chart' },
]

const TITLES = {
  dashboard: ['Dashboard', 'Your business at a glance'],
  schedule: ['Schedule', 'Plan jobs and sync to Google Calendar'],
  clients: ['Clients & Leads', 'Everyone you serve or are quoting'],
  map: ['Map', 'See how your properties are spread out'],
  metrics: ['Metrics', 'Revenue mix and projections'],
}

export default function App() {
  const store = useStore()
  const [tab, setTab] = useState('dashboard')
  const [showLead, setShowLead] = useState(false)
  const [focusClient, setFocusClient] = useState(null)   // client id to open in the drawer
  const [metricsAnchor, setMetricsAnchor] = useState(null) // section to scroll to on Metrics
  const [title, sub] = TITLES[tab]

  const go = (t, anchor) => { setTab(t); if (anchor) setMetricsAnchor(anchor) }
  const openClient = (id) => { setFocusClient(id); setTab('clients') }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22V9" /><path d="M12 9c0-4 3-7 7-7 0 4-3 7-7 7z" /><path d="M12 13c0-3-3-5-6-5 0 3 3 5 6 5z" />
            </svg>
          </div>
          <div>
            <div className="brand-name">Limb</div>
            <div className="brand-sub">Landscaping</div>
          </div>
        </div>

        <nav className="nav">
          {NAV.map((n) => {
            const I = Icon[n.icon]
            return (
              <button key={n.id} className={`nav-item ${tab === n.id ? 'active' : ''}`} onClick={() => setTab(n.id)}>
                <I /> {n.label}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-foot">
          {store.cloud ? (
            <>
              Signed in · data saved to the cloud
              <br />
              <button onClick={() => supabase.auth.signOut()} style={{ color: 'var(--sage)', textDecoration: 'underline', fontSize: 11.5, marginTop: 6 }}>Sign out</button>
            </>
          ) : (
            <>
              Prototype · data saved in this browser
              <br />
              <button onClick={store.reset} style={{ color: 'var(--sage)', textDecoration: 'underline', fontSize: 11.5, marginTop: 6 }}>Reset sample data</button>
            </>
          )}
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <div className="page-title">{title}</div>
            <div className="page-sub">{sub}</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowLead(true)}><Icon.plus /> New lead</button>
        </div>

        <div className="content">
          {store.loading ? (
            <div className="empty" style={{ padding: 80 }}>Loading your data…</div>
          ) : (
            <>
              {tab === 'dashboard' && <Dashboard {...store} go={go} />}
              {tab === 'schedule' && <Schedule {...store} onOpenClient={openClient} />}
              {tab === 'clients' && <Clients {...store} onNew={() => setShowLead(true)} focusClientId={focusClient} onFocusHandled={() => setFocusClient(null)} />}
              {tab === 'map' && <MapView {...store} />}
              {tab === 'metrics' && <Metrics {...store} onOpenClient={openClient} scrollTo={metricsAnchor} onScrolled={() => setMetricsAnchor(null)} />}
            </>
          )}
        </div>
      </main>

      {showLead && <LeadModal onClose={() => setShowLead(false)} onSave={store.addClient} />}
      <AutoGeocoder clients={store.clients} updateClient={store.updateClient} enabled={!store.loading} />
    </div>
  )
}
