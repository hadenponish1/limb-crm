import { useState, useEffect } from 'react'
import { supabase, isCloud } from '../lib/supabase'

// In cloud mode, requires a signed-in user before showing the app.
// In local/demo mode (no Supabase env), renders children directly.
export default function AuthGate({ children }) {
  if (!isCloud) return children
  return <CloudGate>{children}</CloudGate>
}

function CloudGate({ children }) {
  const [session, setSession] = useState(undefined) // undefined = still checking

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (session === undefined) return <Splash>Loading…</Splash>
  if (!session) return <Login />
  return children
}

function Splash({ children }) {
  return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>{children}</div>
}

function Login() {
  const [mode, setMode] = useState('password') // 'password' | 'magic'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setError('')
    if (mode === 'password') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setBusy(false)
      if (error) setError(error.message)
      // success → onAuthStateChange shows the app automatically
    } else {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
      setBusy(false)
      if (error) setError(error.message)
      else setSent(true)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--cream)', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: '32px 30px' }}>
        <div className="brand" style={{ padding: 0, marginBottom: 22 }}>
          <div className="brand-mark">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V9" /><path d="M12 9c0-4 3-7 7-7 0 4-3 7-7 7z" /><path d="M12 13c0-3-3-5-6-5 0 3 3 5 6 5z" /></svg>
          </div>
          <div>
            <div className="brand-name" style={{ color: 'var(--moss)' }}>Limb</div>
            <div className="brand-sub" style={{ color: 'var(--green)' }}>Landscaping CRM</div>
          </div>
        </div>

        {sent ? (
          <div>
            <div className="card-title" style={{ marginBottom: 8 }}>Check your email</div>
            <p className="page-sub">We sent a sign-in link to <b>{email}</b>. Open it on this device to continue.</p>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 16 }} onClick={() => { setSent(false); setMode('password') }}>Back to sign in</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="card-title" style={{ marginBottom: 6 }}>Sign in</div>
            <p className="page-sub" style={{ marginBottom: 18 }}>
              {mode === 'password' ? 'Enter your email and password.' : "Enter your email and we'll send you a secure sign-in link."}
            </p>
            <div className="field">
              <label>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoFocus />
            </div>
            {mode === 'password' && (
              <div className="field">
                <label>Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
            )}
            {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
              {busy ? 'Signing in…' : mode === 'password' ? 'Sign in' : 'Send sign-in link'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button type="button" className="linklike" onClick={() => { setError(''); setMode(mode === 'password' ? 'magic' : 'password') }}>
                {mode === 'password' ? 'Email me a sign-in link instead' : 'Use a password instead'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
